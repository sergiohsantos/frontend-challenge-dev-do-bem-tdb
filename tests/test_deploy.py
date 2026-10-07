"""Exercise the real deployment script with isolated npm/AWS commands; no cloud access."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.cwd = Path(self.temp.name)
        shutil.copytree(ROOT / 'scripts', self.cwd / 'scripts')
        self.bin = self.cwd / 'bin'
        self.bin.mkdir()
        self.log = self.cwd / 'commands.jsonl'
        stub = '''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
name = Path(sys.argv[0]).name
args = sys.argv[1:]
with open(os.environ['COMMAND_LOG'], 'a') as f:
 f.write(json.dumps([name, *args]) + '\\n')
if name == 'npm' and args == ['run', 'build']:
 if os.environ.get('FAIL_BUILD'): sys.exit(1)
 Path('dist/assets').mkdir(parents=True)
 Path('dist/index.html').write_text('<html>test</html>')
 Path('dist/assets/app-test.js').write_text('console.log("test")')
if name == 'aws':
 if os.environ.get('FAIL_ASSETS') and args[:3] == ['s3', 'sync', 'dist/assets/']: sys.exit(1)
 if os.environ.get('FAIL_WAIT') and args[:2] == ['cloudfront', 'wait']: sys.exit(1)
 if args[:2] == ['cloudfront', 'create-invalidation']: print('TEST-INVALIDATION')
'''
        for name in ['aws', 'npm']:
            p = self.bin / name
            p.write_text(stub)
            p.chmod(0o755)
        self.env = {
            **os.environ,
            'PATH': f'{self.bin}:{os.environ["PATH"]}',
            'COMMAND_LOG': str(self.log),
            'AWS_REGION': 'us-east-1',
            'AWS_ACCOUNT_ID': '123456789012',
            'AWS_ROLE_ARN': 'arn:aws:iam::123456789012:role/test-frontend',
            'PRODUCTION_BRANCH': 'main',
            'GITHUB_REF': 'refs/heads/main',
            'GITHUB_SHA': 'a' * 40,
            'GITHUB_STEP_SUMMARY': str(self.cwd / 'summary'),
            'S3_BUCKET': 'test-frontend',
            'CLOUDFRONT_DISTRIBUTION_ID': 'TEST',
            'VITE_API_URL': 'https://api.example.com',
            'VITE_JAVA_API_URL': 'https://api.example.com/java',
            'VITE_AI_API_URL': 'https://api.example.com/ai',
        }
        for key in ['FAIL_BUILD', 'FAIL_ASSETS', 'FAIL_WAIT']:
            self.env.pop(key, None)

    def run_deploy(self):
        return subprocess.run(['bash', 'scripts/deploy-frontend.sh'], cwd=self.cwd,
                              env=self.env, capture_output=True, text=True)

    def commands(self):
        return [json.loads(line) for line in self.log.read_text().splitlines()] if self.log.exists() else []

    def test_success_preserves_assets_and_publishes_index_last(self):
        result = self.run_deploy()
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.commands()
        assets = next(i for i, c in enumerate(calls) if c[:4] == ['aws', 's3', 'sync', 'dist/assets/'])
        index = next(i for i, c in enumerate(calls) if c[:4] == ['aws', 's3', 'cp', 'dist/index.html'])
        invalidate = next(i for i, c in enumerate(calls) if c[:3] == ['aws', 'cloudfront', 'create-invalidation'])
        self.assertLess(assets, index)
        self.assertLess(index, invalidate)
        self.assertFalse(any('--delete' in c for c in calls))
        self.assertIn('Published frontend release', (self.cwd / 'summary').read_text())

    def test_develop_is_blocked_before_any_upload(self):
        self.env['GITHUB_REF'] = 'refs/heads/develop'
        self.assertNotEqual(self.run_deploy().returncode, 0)
        self.assertEqual(self.commands(), [])

    def test_wrong_account_role_is_blocked(self):
        self.env['AWS_ROLE_ARN'] = 'arn:aws:iam::999999999999:role/test'
        self.assertNotEqual(self.run_deploy().returncode, 0)
        self.assertEqual(self.commands(), [])

    def test_missing_configuration_is_blocked(self):
        del self.env['S3_BUCKET']
        self.assertNotEqual(self.run_deploy().returncode, 0)
        self.assertEqual(self.commands(), [])

    def test_private_or_insecure_api_url_is_blocked(self):
        for value in ['http://ai-api.tdb.internal:8001', 'https://ai-api.tdb.internal', 'https://user:password@api.example.com', 'https://example.invalid/ai']:
            with self.subTest(value=value):
                self.env['VITE_AI_API_URL'] = value
                self.assertNotEqual(self.run_deploy().returncode, 0)
                self.assertEqual(self.commands(), [])

    def test_build_failure_never_uploads(self):
        self.env['FAIL_BUILD'] = '1'
        self.assertNotEqual(self.run_deploy().returncode, 0)
        self.assertFalse(any(c[0] == 'aws' for c in self.commands()))

    def test_assets_failure_does_not_publish_index(self):
        self.env['FAIL_ASSETS'] = '1'
        self.assertNotEqual(self.run_deploy().returncode, 0)
        self.assertFalse(any(c[:3] == ['aws', 's3', 'cp'] for c in self.commands()))
        self.assertFalse((self.cwd / 'summary').exists())

    def test_invalidation_failure_does_not_report_success(self):
        self.env['FAIL_WAIT'] = '1'
        self.assertNotEqual(self.run_deploy().returncode, 0)
        self.assertFalse((self.cwd / 'summary').exists())


if __name__ == '__main__':
    unittest.main()

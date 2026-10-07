#!/usr/bin/env bash
set -euo pipefail
for key in AWS_REGION AWS_ROLE_ARN AWS_ACCOUNT_ID PRODUCTION_BRANCH S3_BUCKET CLOUDFRONT_DISTRIBUTION_ID VITE_API_URL VITE_JAVA_API_URL VITE_AI_API_URL GITHUB_REF GITHUB_SHA GITHUB_STEP_SUMMARY; do
  [[ -n "${!key:-}" ]] || { echo "::error::Missing variable $key"; exit 1; }
done
[[ "$PRODUCTION_BRANCH" == main && "$GITHUB_REF" == refs/heads/main ]] || {
  echo '::error::AWS production deployment requires main and PRODUCTION_BRANCH=main'; exit 1;
}
[[ "$AWS_ACCOUNT_ID" =~ ^[0-9]{12}$ && "$AWS_ROLE_ARN" == "arn:aws:iam::$AWS_ACCOUNT_ID:role/"* ]] || {
  echo '::error::AWS account and role ARN must match'; exit 1;
}
node --input-type=module <<'JS'
for (const key of ['VITE_API_URL', 'VITE_JAVA_API_URL', 'VITE_AI_API_URL']) {
  let url;
  try { url = new URL(process.env[key]); } catch { throw new Error(`${key} must be an absolute HTTPS URL`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.hostname === 'localhost' || url.hostname.endsWith('.internal') || url.hostname.endsWith('.invalid')) {
    throw new Error(`${key} must point to the public HTTPS API entry, without credentials, query or fragment`);
  }
}
JS

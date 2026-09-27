#!/usr/bin/env bash
set -euo pipefail
for key in S3_BUCKET CLOUDFRONT_DISTRIBUTION_ID VITE_API_URL VITE_JAVA_API_URL VITE_AI_API_URL; do
  [[ -n "${!key:-}" ]] || { echo "::error::Missing variable $key"; exit 1; }
done
npm ci
npm run build
[[ -f dist/index.html ]]
aws s3 sync dist/ "s3://$S3_BUCKET/releases/$GITHUB_SHA/" --cache-control 'no-cache'
# Keep previous hashed assets so active browser sessions and rollback still work.
aws s3 sync dist/ "s3://$S3_BUCKET/" --exclude 'index.html' --exclude 'assets/*' --cache-control 'public,max-age=3600'
if [[ -d dist/assets ]]; then
  aws s3 sync dist/assets/ "s3://$S3_BUCKET/assets/" --cache-control 'public,max-age=31536000,immutable'
fi
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" --content-type 'text/html' --cache-control 'no-cache,no-store,must-revalidate'
inv=$(aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths '/*' --query 'Invalidation.Id' --output text)
aws cloudfront wait invalidation-completed --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --id "$inv"
echo "Published frontend release: $GITHUB_SHA" >> "$GITHUB_STEP_SUMMARY"

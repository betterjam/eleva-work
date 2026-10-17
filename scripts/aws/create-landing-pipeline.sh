#!/usr/bin/env bash
# One-time creation of the eleva-landing-prod pipeline: GitHub main → CodeBuild
# (buildspec.yml at the repo root builds, syncs to the eleva.school bucket and
# invalidates CloudFront). Same shape as the eleva-web-prod pipeline.
#
#   AWS_PROFILE=eleva scripts/aws/create-landing-pipeline.sh
#
# Creates: an artifact bucket, a CodeBuild role + project, a pipeline role +
# pipeline. Re-running skips what already exists. The site bucket and the
# distribution are NOT created or changed here: they already serve eleva.school.
# The pipeline runs as soon as it is created and publishes main.
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
NAME="eleva-landing-prod"
GITHUB_REPO="${GITHUB_REPO:-betterjam/eleva-landing}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"
CONNECTION_NAME="${CONNECTION_NAME:-personal}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-EWI65SPV6QW2U}"

export AWS_PAGER=""
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
SITE_BUCKET="${SITE_BUCKET:-eleschool-${ACCOUNT}-${REGION}-an}"
ARTIFACT_BUCKET="${NAME}-artifacts-${ACCOUNT}-${REGION}"
CONNECTION_ARN="$(aws codeconnections list-connections --region "$REGION" \
  --query "Connections[?ConnectionName=='${CONNECTION_NAME}'].ConnectionArn" --output text)"
[ -n "$CONNECTION_ARN" ] || { echo "No CodeConnections connection named '${CONNECTION_NAME}'" >&2; exit 1; }
aws s3api head-bucket --bucket "$SITE_BUCKET" >/dev/null || { echo "Site bucket ${SITE_BUCKET} not found" >&2; exit 1; }

echo "account ${ACCOUNT} · site bucket ${SITE_BUCKET} · distribution ${DISTRIBUTION_ID}"
echo "source ${GITHUB_REPO}@${GITHUB_BRANCH} via ${CONNECTION_ARN}"

# ── 1. artifact bucket (private, encrypted, artifacts expire after 30 days) ──
if ! aws s3api head-bucket --bucket "$ARTIFACT_BUCKET" 2>/dev/null; then
  aws s3api create-bucket --bucket "$ARTIFACT_BUCKET" --region "$REGION" >/dev/null
  aws s3api put-public-access-block --bucket "$ARTIFACT_BUCKET" \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  aws s3api put-bucket-encryption --bucket "$ARTIFACT_BUCKET" \
    --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
  aws s3api put-bucket-lifecycle-configuration --bucket "$ARTIFACT_BUCKET" \
    --lifecycle-configuration '{"Rules":[{"ID":"expire-artifacts","Status":"Enabled","Filter":{"Prefix":""},"Expiration":{"Days":30}}]}'
  echo "created artifact bucket ${ARTIFACT_BUCKET}"
fi

# ── 2. CodeBuild role: logs, read artifacts, publish to the site bucket, invalidate ──
BUILD_ROLE="${NAME}-codebuild"
if ! aws iam get-role --role-name "$BUILD_ROLE" >/dev/null 2>&1; then
  aws iam create-role --role-name "$BUILD_ROLE" --tags Key=project,Value=eleva-landing \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"codebuild.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
  echo "created role ${BUILD_ROLE}"
fi
aws iam put-role-policy --role-name "$BUILD_ROLE" --policy-name build-and-publish --policy-document "$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": ["arn:aws:logs:${REGION}:${ACCOUNT}:log-group:/aws/codebuild/${NAME}",
                   "arn:aws:logs:${REGION}:${ACCOUNT}:log-group:/aws/codebuild/${NAME}:*"] },
    { "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:GetObjectVersion", "s3:PutObject", "s3:GetBucketLocation", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::${ARTIFACT_BUCKET}", "arn:aws:s3:::${ARTIFACT_BUCKET}/*"] },
    { "Effect": "Allow", "Action": ["s3:ListBucket"], "Resource": "arn:aws:s3:::${SITE_BUCKET}" },
    { "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:PutObjectAcl", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::${SITE_BUCKET}/*" },
    { "Effect": "Allow", "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::${ACCOUNT}:distribution/${DISTRIBUTION_ID}" }
  ]
}
JSON
)"

# ── 3. CodeBuild project: buildspec.yml from the source, Node 22 on standard:7.0 ──
if ! aws codebuild batch-get-projects --names "$NAME" --region "$REGION" --query 'projects[0].name' --output text 2>/dev/null | grep -qx "$NAME"; then
  sleep 10 # new IAM roles take a few seconds to become assumable
  aws codebuild create-project --region "$REGION" --name "$NAME" \
    --description "Builds eleva.school (Next.js static export) and publishes it to S3 + CloudFront" \
    --source type=CODEPIPELINE,buildspec=buildspec.yml \
    --artifacts type=CODEPIPELINE \
    --environment "type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL,environmentVariables=[{name=SITE_BUCKET,value=${SITE_BUCKET},type=PLAINTEXT},{name=DISTRIBUTION_ID,value=${DISTRIBUTION_ID},type=PLAINTEXT}]" \
    --service-role "arn:aws:iam::${ACCOUNT}:role/${BUILD_ROLE}" \
    --timeout-in-minutes 20 --queued-timeout-in-minutes 60 \
    --logs-config "cloudWatchLogs={status=ENABLED,groupName=/aws/codebuild/${NAME}}" \
    --tags key=project,value=eleva-landing >/dev/null
  echo "created CodeBuild project ${NAME}"
fi

# ── 4. pipeline role: artifacts, start the build, use the GitHub connection ──
PIPE_ROLE="${NAME}-pipeline"
if ! aws iam get-role --role-name "$PIPE_ROLE" >/dev/null 2>&1; then
  aws iam create-role --role-name "$PIPE_ROLE" --tags Key=project,Value=eleva-landing \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"codepipeline.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
  echo "created role ${PIPE_ROLE}"
fi
aws iam put-role-policy --role-name "$PIPE_ROLE" --policy-name run-pipeline --policy-document "$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:GetObjectVersion", "s3:PutObject", "s3:GetBucketVersioning", "s3:GetBucketLocation", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::${ARTIFACT_BUCKET}", "arn:aws:s3:::${ARTIFACT_BUCKET}/*"] },
    { "Effect": "Allow", "Action": ["codebuild:StartBuild", "codebuild:BatchGetBuilds"],
      "Resource": "arn:aws:codebuild:${REGION}:${ACCOUNT}:project/${NAME}" },
    { "Effect": "Allow", "Action": ["codeconnections:UseConnection", "codestar-connections:UseConnection"],
      "Resource": "${CONNECTION_ARN}" }
  ]
}
JSON
)"

# ── 5. the pipeline: Source (GitHub, on push to main) → Build ──
if ! aws codepipeline get-pipeline --name "$NAME" --region "$REGION" >/dev/null 2>&1; then
  sleep 10
  aws codepipeline create-pipeline --region "$REGION" --cli-input-json "$(cat <<JSON
{
  "pipeline": {
    "name": "${NAME}",
    "pipelineType": "V2",
    "executionMode": "SUPERSEDED",
    "roleArn": "arn:aws:iam::${ACCOUNT}:role/${PIPE_ROLE}",
    "artifactStore": { "type": "S3", "location": "${ARTIFACT_BUCKET}" },
    "stages": [
      { "name": "Source", "actions": [ {
          "name": "GitHub", "runOrder": 1,
          "actionTypeId": { "category": "Source", "owner": "AWS", "provider": "CodeStarSourceConnection", "version": "1" },
          "configuration": { "ConnectionArn": "${CONNECTION_ARN}", "FullRepositoryId": "${GITHUB_REPO}", "BranchName": "${GITHUB_BRANCH}", "DetectChanges": "true" },
          "outputArtifacts": [ { "name": "Source" } ] } ] },
      { "name": "Build", "actions": [ {
          "name": "BuildAndPublish", "runOrder": 1,
          "actionTypeId": { "category": "Build", "owner": "AWS", "provider": "CodeBuild", "version": "1" },
          "configuration": { "ProjectName": "${NAME}" },
          "inputArtifacts": [ { "name": "Source" } ] } ] }
    ]
  },
  "tags": [ { "key": "project", "value": "eleva-landing" } ]
}
JSON
)" >/dev/null
  echo "created pipeline ${NAME} (it is running now)"
fi

echo "done: https://${REGION}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${NAME}/view?region=${REGION}"

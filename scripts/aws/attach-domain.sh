#!/usr/bin/env bash
# Attach eleva.works and www.eleva.works to the CloudFront distribution once the ACM
# certificate is issued (it validates through Route 53 after the domain's nameservers
# at the registrar point to the hosted zone). Safe to re-run.
#
#   AWS_PROFILE=eleva scripts/aws/attach-domain.sh
set -euo pipefail
export AWS_PAGER=""
DIST_ID="${DIST_ID:-E66FS6J8XLRWN}"
CERT_ARN="${CERT_ARN:-arn:aws:acm:us-east-1:166429125068:certificate/391bfea2-3817-4fbc-8b25-c6f02fc99ade}"
DOMAINS='["eleva.works","www.eleva.works"]'

status="$(aws acm describe-certificate --region us-east-1 --certificate-arn "$CERT_ARN" --query Certificate.Status --output text)"
if [ "$status" != "ISSUED" ]; then
  echo "Certificate is ${status}. Point the eleva.works nameservers at Namecheap to Route 53 and run this again." >&2
  exit 1
fi

tmp="$(mktemp -d)"
aws cloudfront get-distribution-config --id "$DIST_ID" > "$tmp/current.json"
etag="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["ETag"])' "$tmp/current.json")"
python3 - "$tmp/current.json" "$CERT_ARN" "$DOMAINS" > "$tmp/new.json" <<'PY'
import json, sys
cfg = json.load(open(sys.argv[1]))["DistributionConfig"]
domains = json.loads(sys.argv[3])
cfg["Aliases"] = {"Quantity": len(domains), "Items": domains}
cfg["ViewerCertificate"] = {"ACMCertificateArn": sys.argv[2], "SSLSupportMethod": "sni-only",
                            "MinimumProtocolVersion": "TLSv1.2_2021", "Certificate": sys.argv[2],
                            "CertificateSource": "acm"}
print(json.dumps(cfg))
PY
aws cloudfront update-distribution --id "$DIST_ID" --if-match "$etag" --distribution-config "file://$tmp/new.json" \
  --query 'Distribution.{status:Status,aliases:DistributionConfig.Aliases.Items}' --output json
echo "Attached. CloudFront takes a few minutes to deploy; then https://eleva.works is live."

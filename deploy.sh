#!/bin/bash

echo "Updating githash.txt..."
git rev-parse --short HEAD > githash.txt

echo "Submitting build to Google Cloud Build..."
gcloud builds submit --tag europe-west3-docker.pkg.dev/scape-data-capture/scape-evaluator/scape-evaluator

echo "Deploying to Cloud Run..."
gcloud run deploy scape-evaluator \
  --image europe-west3-docker.pkg.dev/scape-data-capture/scape-evaluator/scape-evaluator:latest \
  --platform managed \
  --region europe-west3 \
  --allow-unauthenticated \
  --min-instances=1 \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest,GOOGLE_OAUTH_CLIENT_SECRET=GOOGLE_OAUTH_CLIENT_SECRET:latest"

echo "Deployment complete!"

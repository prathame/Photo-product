
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js, Python 3.11+

### Frontend

1. Install dependencies: `npm install`
2. Create `.env.local` and set:
   ```
   VITE_API_URL=http://localhost:8000/api
   VITE_ADMIN_PASSWORD=admin
   GEMINI_API_KEY=your-google-genai-key
   VITE_ENABLE_ADMIN=false   # optional; leave unset/true locally, set false to hide /admin
   ```
3. Run the app: `npm run dev`

### Backend (FastAPI)

1. Create a virtual environment and install requirements:
   ```
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. (Optional) create `backend/.env` to override defaults:
   ```
   ADMIN_PASSWORD=admin
   CORS_ORIGINS=["http://localhost:5173"]
   ```
3. Start the API:
   ```
   uvicorn backend.main:app --reload
   ```
   The API is available at `http://localhost:8000/api` and serves images from `/static`.

## Build a single container image

The provided `Dockerfile` builds the React frontend and FastAPI backend into one image that serves both the API and the static SPA.

```
docker build -t lumina-portfolio:latest .
docker run -p 8000:8000 -e ADMIN_PASSWORD=supersecret lumina-portfolio:latest
```

In production the frontend automatically talks to the co-hosted API because it defaults to `/api` whenever `VITE_API_URL` is not provided.

## Deploy to OpenShift

1. Build and push the container image to Red Hat’s image registry:
   ```
   podman build -t images.paas.redhat.com/pbusa/photo:latest .
   podman push images.paas.redhat.com/pbusa/photo:latest
   ```
2. Create/update the admin secret (edit the plaintext password in `openshift/secret.yaml` first):
   ```
   oc apply -f openshift/secret.yaml
   ```
3. Provision persistent storage for uploads (RWX EFS class, adjust tier as needed):
   ```
   oc apply -f - <<'EOF'
   apiVersion: v1
   kind: PersistentVolumeClaim
   metadata:
     name: lumina-portfolio-uploads
   spec:
     accessModes:
       - ReadWriteMany
     resources:
       requests:
         storage: 25Gi
     storageClassName: aws-efs-tier-c2-1
   EOF
   ```
4. Update the `image:` reference inside `openshift/deployment.yaml` to `images.paas.redhat.com/pbusa/photo:latest`.
5. Apply the manifests (deployment + service + route):
   ```
   oc apply -f openshift/deployment.yaml
   ```

The manifest creates a Deployment (1 replica), a Service, and a public Route. Health probes hit `/health`, uploads are stored on the PVC, and the route serves both the API (`/api`) and the built frontend (`/`).

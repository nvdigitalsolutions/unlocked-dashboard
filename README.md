# Full-Stack Monorepo: Next.js (Craft.js) Frontend & Strapi Backend

This repository provides an example of a full-stack project using a Next.js frontend and a Strapi backend. The setup uses Docker for local development and includes configuration files for deployment to DigitalOcean's App Platform with these features:

- **Backend**
  - Collection types for Pages, Products, Orders, Appointments and Video Calls.
  - Appointment creation checks for time slot conflicts.
  - Orders are created automatically from the Stripe webhook.
  - Preview mode enabled via `CLIENT_URL` and `PREVIEW_SECRET`.
- **Frontend**
  - Pages for the dashboard, appointments, store and dynamic `[slug]` routes.
  - Login form that stores the Strapi JWT using an API route.
  - Preview and login API routes.
  - All pages from Strapi, including the homepage, are editable with Craft.js components.

## Structure

```
repo-root/
├── frontend/              # Next.js 15+ app (Tailwind CSS, Craft.js builder)
│   ├── pages/             # Next.js pages (dashboard, appointments, store, [slug].js, API routes)
│   ├── components/        # React components (including Craft.js editor components)
│   ├── lib/               # Utility libraries (e.g. auth helper, Stripe integration)
│   ├── public/            # Public assets (if any)
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── next.config.js     # Next.js configuration (env variables, etc.)
│   ├── Dockerfile         # Dockerfile for containerizing the Next.js app
│   └── package.json       # Frontend dependencies and scripts
├── backend/               # Strapi v4 CMS app (Node.js headless CMS)
│   ├── config/            # Configuration (database, server, middleware using env vars)
│   ├── src/
│   │   ├── api/           # Content type definitions (Pages, Products, Orders, etc.)
│   │   ├── extensions/    # Extensions or custom code (e.g. controllers for Stripe webhooks)
│   │   ├── index.js       # Strapi bootstrap file (seeds initial data on startup)
│   │   └── ...            # (Other Strapi framework files)
│   ├── Dockerfile         # Dockerfile for containerizing the Strapi app
│   └── package.json       # Backend dependencies (Strapi, plugins, etc.)
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions workflow for CI/CD to DigitalOcean
├── .do/
│   └── app.yaml           # DigitalOcean App Platform spec (defines services, env vars)
├── docker-compose.yml     # Docker Compose for local dev (frontend + backend + database)
├── .env.example           # Example environment variables (to be copied to .env and edited)
├── .gitignore             # Git ignore for Node, logs, build artifacts, etc.
├── .dockerignore          # Docker ignore to reduce build context (e.g. node_modules)
└── README.md              # Documentation for setup, usage, and deployment
```

## Development

1. Copy `.env.example` to `.env` and adjust values as needed (particularly `APP_KEYS`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT` and `JWT_SECRET`).
   If you plan to access the frontend from another machine on your network, set
   `NEXT_PUBLIC_BACKEND_URL` to the host's reachable IP (e.g. `http://192.168.2.20:1337`).
2. Start the stack with Docker Compose (dependencies will be installed automatically):
   ```bash
   docker compose up --build
   ```
3. Visit `http://localhost:3000` for the frontend and `http://localhost:1337` for Strapi.
4. If you access the frontend using a different hostname or IP, set `ALLOWED_DEV_ORIGIN` in `.env` to that URL. Multiple origins can be provided as a comma-separated list so Next.js allows cross-origin requests during development. For example:
   ```bash
   ALLOWED_DEV_ORIGIN=http://localhost:3000,http://192.168.2.20:3000
   ```

## Running tests

Both the backend and frontend include small Jest test suites. Execute them with:

```bash
cd backend && npm test
cd ../frontend && npm test
```

## Deployment

A sample GitHub Actions workflow (`.github/workflows/deploy.yml`) and DigitalOcean spec (`.do/app.yaml`) are provided as a starting point. Update them with your own values before enabling CI/CD.

## Fresh Ubuntu setup

The repository includes a convenience script that installs all dependencies and starts the Docker stack. The steps below assume a brand new Ubuntu Server 22.04 installation running inside a Hyper-V virtual machine, but they also work on any Ubuntu 22.04 host.

If you still need to create the VM itself, run the following commands from an elevated PowerShell prompt on the Windows host:

```powershell
# 1. Create an external virtual switch (if you don’t already have one)
New-VMSwitch -Name "ExternalSwitch" -NetAdapterName "Ethernet" -AllowManagementOS $true

# 2. Create a new VM
$vmName    = "dev-monorepo"
$vhdPath   = "C:\HyperV\VirtualHardDisks\$vmName.vhdx"
$isoPath   = "C:\ISOs\ubuntu-22.04.5-live-server-amd64.iso"  # download from https://releases.ubuntu.com/22.04/
$mem       = 4GB
$cpus      = 2
New-VM -Name $vmName `
       -MemoryStartupBytes $mem `
       -Generation 2 `
       -NewVHDPath $vhdPath `
       -NewVHDSizeBytes 50GB `
       -SwitchName "ExternalSwitch"

# 3. Attach the Ubuntu Server ISO
Add-VMDvdDrive -VMName $vmName -Path $isoPath

# 4. Allocate processors
Set-VMProcessor -VMName $vmName -Count $cpus

# 5. Boot the VM
Start-VM -Name $vmName

# At this point, open the VM console in Hyper‑V Manager, and
# go through the Ubuntu Server installer:
#   • Choose your language, keyboard, etc.
#   • Configure a normal user (e.g. `ubuntu`), password, and openSSH server.
#   • Let the installer partition the disk and finish.
```


```bash
# 1. Install required packages
sudo apt update
sudo apt install -y ca-certificates curl gnupg git lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 2. Clone the repository and run the setup script
git clone https://github.com/nvdigitalsolutions/unlocked-dashboard.git
cd unlocked-dashboard
./scripts/setup_ubuntu_hyperv.sh
```

The script will:

1. Install Node.js 18 using NodeSource.
2. Ensure Docker is running and your user is part of the `docker` group.
3. Copy `.env.example` to `.env` if needed and generate a random `JWT_SECRET`.
4. Install backend and frontend dependencies.
5. Build and launch the Docker containers.

After it finishes you can visit the frontend at `http://localhost:3000` and the Strapi admin at `http://localhost:1337`.

If Docker fails with a permission denied error when accessing `/var/run/docker.sock`, open a new terminal session or run `newgrp docker` so your shell picks up the new group membership, then rerun the last command.

### Manual steps

If you prefer to install everything manually, follow these commands instead of running the script:

```bash
# Install required packages
sudo apt update
sudo apt install -y ca-certificates curl gnupg git lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin nodejs npm

# Clone the repository
git clone <this-repo-url>
cd unlocked-dashboard

# Copy environment variables
cp .env.example .env

# Start services (dependencies will be installed automatically)
docker compose up --build
```

Once the services start you can access the frontend at `http://localhost:3000` and the Strapi admin at `http://localhost:1337`.

For an outline of how to turn this starter into the full-featured monorepo described in the project brief, see [docs/upgrade.md](docs/upgrade.md).

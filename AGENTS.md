# Upgrade Guide: Node.js 20 for *Unlocked Dashboard*

## Overview

The *Unlocked Dashboard* monorepo was previously pinned to **Node.js 18**, and using a different Node version (e.g. Node 20) led to runtime errors in Strapi (for example, `TypeError: Cannot read properties of undefined (reading 'attributes')`). Node 20 is now an active LTS release and brings performance improvements and extended support. This guide provides step-by-step instructions to upgrade the project (both the Strapi 5 backend and Next.js 15 frontend) from Node.js 18 to Node.js 20. We will update configuration files, ensure dependencies are compatible, reinstall modules, and verify everything works with Node 20.

Following these steps will eliminate the Node 18 requirement and resolve the known Strapi startup error on Node 20. All commands below assume a Unix-like shell (bash/zsh). Please read through each section before performing the upgrade.

## 1. Update Node Version in Configuration Files

First, update all places where the Node.js version is explicitly specified:

* **NVM configuration:** Open the root **`.nvmrc`** file and change its contents from `18` to `20`. This ensures that developers using `nvm` will default to Node 20 in this project.
* **Package engine requirements:** In the **`package.json`** of both the backend and frontend, update the Node engine field to allow Node 20:

  * *Backend (`backend/package.json`)* – Change the `"engines".node` field from `"18.x"` to `"20.x"`.
  * *Frontend (`frontend/package.json`)* – Likewise, change the Node engine from `"18.x"` to `"20.x"`.
    These changes will inform any tooling (and other developers) that Node 20 is the expected version.
* **Development startup script:** If you use the backend's dev helper script, update it to reflect Node 20. In **`backend/start-dev.sh`**, change the `required_major` from `18` to `20`. This script checks the Node version and will now enforce Node 20 when running Strapi in development.
* **Dockerfiles:** Update the Node base image versions in both Dockerfiles:

  * In **`backend/Dockerfile`**, change the first line to use Node 20 (e.g. `FROM node:20-alpine` instead of `node:18-alpine`).
  * In **`frontend/Dockerfile`**, change the base image to Node 20 as well (e.g. `FROM node:20-slim` instead of `node:18-slim`).
    Make sure to use a corresponding Node 20 image variant (alpine, slim, etc.) that matches the previous one.
* **CI/Setup scripts:** Update any other references to Node 18 in project scripts or config:

  * For example, the provided setup script for Ubuntu (`scripts/setup_ubuntu_hyperv.sh`) currently installs Node 18 via NodeSource. Modify that to use the Node 20 setup script (replace `setup_18.x` with `setup_20.x` and ensure it installs Node 20).
  * If you have CI/CD workflows or deployment configs that explicitly specify a Node version (for instance, a GitHub Actions job using `actions/setup-node` or a runtime on DigitalOcean not using the Dockerfile), update those to Node 20 as well.

After these edits, all configuration files should indicate Node 20 instead of Node 18. Commit these changes so that the Node 20 requirement is clear to all users and environments.

## 2. Ensure Dependencies Are Compatible with Node 20

Node.js 20 is largely backwards-compatible with Node 18, but it’s important to make sure all key dependencies support Node 20:

* **Strapi 5 Core and Plugins:** Verify that the Strapi version in use is up-to-date and supports Node 20. Strapi v5 supports active LTS Node versions (including Node 20). In the backend `package.json`, the Strapi packages are `"@strapi/strapi": "^5.18.0"` and the Users & Permissions plugin is `"@strapi/plugin-users-permissions": "^5.18.0"`. These versions are recent and should work on Node 20.

  * If you are on an older Strapi 5.x release, upgrade to the latest patch version (at least 5.18.0 or newer). Keeping Strapi core and its official plugins at the same version is recommended to avoid compatibility issues. For example, if a Strapi update is available (check `npm outdated` or Strapi release notes), bump the version in `package.json` and run the upgrade (Strapi provides an [`@strapi/upgrade`](https://docs.strapi.io/dev-docs/upgrade/version-updates#upgrade-helper) tool, but for minor upgrades simply updating the package version and reinstalling is often sufficient).
  * After upgrading, double-check Strapi release notes for any breaking changes, but minor/patch releases typically just include fixes (some might specifically address Node 20 compatibility).
* **Next.js 15 and Frontend libs:** The frontend uses Next.js 15.x and React 19.x, which require Node 18.8+ and are fully compatible with Node 20. In fact, Vercel *recommends* using Node 20 for Next.js 15. Ensure you are on the latest Next.js 15 release (the `package.json` shows `"next": "^15.3.5"` which is a recent version). You do not need to change this just for Node 20, but if an update is available (e.g. 15.3.x to 15.4), you may choose to update it to benefit from fixes. The same goes for React; React 19 is new and works on Node 20, just keep the versions as-is or update if a new stable release comes out.
* **PostgreSQL Driver (`pg`):** The backend relies on the Node Postgres client (`pg` at version 8.16.3). Version 8.x of `pg` supports Node 20, so this should be fine. If you were using an older major version of `pg` (e.g. 7.x) or a much older 8.x release, you would want to upgrade it, because Node 20 updated its TLS and OpenSSL libraries which could affect database drivers. In our case, **pg 8.16.3 is modern** and no specific changes are required. Just ensure it remains up-to-date (you can run `npm update pg` to get the latest 8.x if your lockfile was holding an older minor).
* **Other dependencies:** Review any other critical dependencies for Node 20 support:

  * If you use **native addons** or binaries, they may need recompilation. For example, Strapi might use **`better-sqlite3`** as a dependency (for SQLite support in quick start). If this module is present, it needs to be rebuilt for Node 20. We will address this by reinstalling modules in the next step, but be aware that any error about a module “missing or not built” (e.g. *"Module did not self-register"* or similar) indicates a rebuild is needed. Our dev script already tries to rebuild `better-sqlite3` automatically, but if you encounter issues outside of that script, a manual rebuild may be necessary.
  * **Node-sass** (for example) is a common native module that often breaks on new Node versions. In this project, we use PostCSS/Tailwind CSS, so we don’t have node-sass. If you have added any other binaries or custom modules, check their compatibility. Most well-maintained packages will have released updates by now to support Node 20.
  * It's generally a good idea to run `npm outdated` in both `backend` and `frontend` folders to see if any dependencies have updates that might include Node 20 fixes. Update as needed, focusing on major frameworks like Strapi, Next, and database or build tools.

In summary, ensure Strapi and its plugins are on the latest v5.x, Next.js is on latest v15.x, and the `pg` driver (and any other critical libraries) are updated. All these should be Node 20–ready. Once the package versions are set, proceed to reinstall dependencies under Node 20.

## 3. Reinstall Node Modules for Node 20

After changing Node versions and adjusting any package versions, **reinstalling dependencies** will ensure that any binaries are compiled for Node 20 and that you get any updated sub-dependencies needed for Node 20 support. We will also clear out old artifacts to prevent conflicts:

1. **Switch to Node 20** on your system before installing. If you use `nvm`, run `nvm use 20`. If Node 20 isn’t installed yet, install it (e.g. `nvm install 20` or use your OS package manager). Verify `node -v` shows a 20.x version.
2. **Remove existing installations** to avoid leftover binaries from Node 18:

   ```bash
   # In the repository root
   cd backend/
   rm -rf node_modules package-lock.json
   cd ../frontend/
   rm -rf node_modules package-lock.json
   cd ..
   ```

   We remove `node_modules` in both projects to force a clean reinstall. Removing the `package-lock.json` is optional but recommended here to allow dependency versions to refresh to the latest allowed by your `package.json` (ensuring any Node 20 related fixes are pulled in). If you prefer to keep exact versions, you can omit deleting the lockfile, but then make sure to manually update any critical packages as noted in the previous step.
3. **Install dependencies fresh** under Node 20:

   ```bash
   cd backend/
   npm install
   cd ../frontend/
   npm install
   ```

   This will install all packages, compiling any native addons against Node 20. If you updated the `engines` field, npm may warn if you are not running Node 20 while installing – another reason to ensure you actually switched to Node 20 first. <br>*(If your team uses Yarn v3 instead of npm, run `yarn install` in each directory instead. The steps otherwise remain the same.)*
4. **Rebuild any missing binaries (if needed):** The install process should handle most cases. However, if the Strapi backend uses SQLite in development (which brings in `better-sqlite3`), you might need to rebuild it. The `start-dev.sh` script will do this automatically on first run. If you’re not using that script and you get an error about *better-sqlite3*, run:

   ```bash
   cd backend/
   npm rebuild better-sqlite3
   ```

   Similarly, for any other module that prints an error about an ELF mismatch or version mismatch, reinstalling or rebuilding it will fix the issue on Node 20.

Alternatively, **if you use Docker for local development**, you can achieve the above by simply rebuilding the containers:

* After updating the Dockerfiles to Node 20, run: `docker compose build --no-cache` to force rebuild the images with Node 20. This will install dependencies inside the containers (as specified by the Dockerfiles) from scratch. Then run `docker compose up` to start the stack. The effect is equivalent to the manual steps above, so you can either do it in Docker or on your host machine depending on your workflow.

Make sure the install step completes without errors. Warnings about optional dependencies or deprecations are normal, but errors or build failures need to be addressed (often by installing missing build tools or updating a package). With a clean `node_modules` installed under Node 20, we can proceed to testing.

## 4. Verification and Testing

Now it’s time to verify that both the backend and frontend work correctly with Node 20.

**A. Run the development servers:**

* **Backend (Strapi)** – Start the Strapi server in development mode. If you’re running outside Docker, use:

  ```bash
  cd backend/
  npm run develop
  ```

  This runs Strapi with auto-reload. Watch the terminal output for any errors during startup. You should **no longer see** the `"Cannot read properties of undefined (reading 'attributes')"` error on Node 20. Strapi should initialize and connect to the database. Once running, verify you can access the Strapi Admin UI at [http://localhost:1337/admin](http://localhost:1337/admin) (use the admin credentials you have set, or create a new admin if this is the first run).

  * If the backend fails to start, check the error message. Common issues could be missing environment variables (ensure your `.env` is in place), or a database connection issue. These are likely unrelated to Node 20. However, if you get a low-level error (like a crash in a native module), double-check that all dependencies were installed correctly (see step 3).
* **Frontend (Next.js)** – In a separate terminal, start the Next.js development server:

  ```bash
  cd frontend/
  npm run dev
  ```

  This launches the Next.js app on [http://localhost:3000](http://localhost:3000). Verify that the frontend compiles successfully and connects to the backend API without issues. You should be able to log in and navigate the app as before.

  * Test critical functionality: for example, open the dashboard page (which should load Craft.js editor if logged in), fetch some content pages, etc., to ensure the Next.js server can communicate with Strapi. Since we haven't changed code logic, everything should behave the same as with Node 18.
  * The frontend console or terminal might show warnings but there should be no Node-related errors. Next.js 15 is compatible with Node 20, so it should function normally.

If you normally use `docker compose` for development, you should achieve the same result by running `docker compose up` after rebuilding. The `backend` container (Node 20 base) will run `npm run develop` internally, and the `frontend` container will run `npm run dev`, as defined in your Docker Compose setup. Check `docker compose logs` to ensure both services started properly.

**B. Run the test suites:**

Both the backend and frontend have Jest tests defined. It’s important to run them on Node 20 to catch any subtle differences:

* From the repository root (or individually):

  ```bash
  cd backend/ && npm test
  ```

  and

  ```bash
  cd frontend/ && npm test
  ```

  All tests should pass as before. A failure might indicate an assumption in tests that doesn’t hold in Node 20, though this is uncommon. Fix any test failures that are relevant (for example, if there are snapshot tests that include Node version in output, you may need to update those snapshots).

**C. Build for production (optional but recommended):**

To be thorough, do a production build and run to ensure the production build processes (which can differ from dev) also work on Node 20:

* **Backend build:** In `backend/`, run `npm run build`. This will compile the Strapi admin panel (and any necessary backend build steps). Ensure it completes without errors. Then you can simulate a production start with `npm run start` (which will use the built assets). Visit the Strapi endpoints (both API and admin) to verify they work in this mode.
* **Frontend build:** In `frontend/`, run `npm run build`. This creates an optimized production build in the `.next` folder. After a successful build, run `npm start` to launch the Next.js app in production mode. Verify that the site works and can fetch data from the backend (you might need to ensure environment variables for backend URL are set correctly for the production mode, just as in development).

Performing a production build test is mainly to catch any build-time issues. Given that our dev run was successful, these should also succeed. In particular, watch for any Node 20-related warnings during builds (for example, newer Node might deprecate some APIs and tools might warn about them; you can address those as needed, though they won't block functionality).

## 5. Post-Upgrade Notes & Troubleshooting

* **Strapi startup issues:** After completing the above steps, Strapi should start on Node 20 without the earlier error. The error `"Cannot read properties of undefined (reading 'attributes')"` that occurred with Node 20 was likely due to using an unsupported Node version with an older Strapi build. By upgrading the Node version in configs and reinstalling, this is resolved. If you *still* encounter that error (or a similar one) on startup, consider the following:

  * Ensure that all your Strapi packages are indeed updated to Node-20-compatible versions (check the installed version with `npm ls @strapi/strapi` and ensure it matches the one you set in package.json).
  * Remove any Strapi build cache and temporary files. For example, delete the **`backend/.cache`** folder if it exists, then run `npm run develop` again – Strapi will rebuild its admin UI fresh.
  * Double-check that your Node environment is actually running v20.x. If you accidentally still had Node 18 when installing, some modules could be built against the wrong version. Running `node -v` inside the backend container or shell where Strapi runs will verify this.
  * If the issue persists, consult Strapi's documentation or community forums – there may have been specific patches for Node 20 in a version later than yours. Upgrading to the latest Strapi v5 release might be necessary in such a case.
* **Rebuilding native modules:** If you encounter an error like *“Module did not self-register”* or *“Wrong ELF class: ELFCLASS64”* for any Node module, it means a native addon was not built for Node 20. The solution is to rebuild or reinstall that module under Node 20. For example, as mentioned, `better-sqlite3` might need manual rebuilding if not handled automatically. Running `npm rebuild <module_name>` usually fixes it. In worst case, delete `node_modules` and install again, making sure Node 20 is active.
* **Docker considerations:** When deploying via Docker (e.g. to DigitalOcean App Platform or another host), ensure the updated Dockerfiles are used. The base images are now Node 20, so when you push your code and trigger a deploy, the new images will be built with Node 20. For DigitalOcean, no further changes are needed if you're using the Dockerfile deploy method – just deploy the updated code. For GitHub Actions workflows or other CI that might cache layers: consider clearing the build cache or incrementing image tags so that the Node 20 base is pulled fresh.
* **Performance and memory:** Node 20 comes with V8 engine improvements. It's worth noting that Node 20 also enabled the **V8 JavaScript engine** with newer features and the **experimental Fetch API** globally. Our application should not be affected by these except perhaps minor differences in performance. Monitor your application after upgrade; you might notice slight improvements in speed. The backend Dockerfile sets a memory limit for Node (`--max_old_space_size=4096`) to prevent build failures – this is still applicable and can remain unchanged.
* **Update notices:** Node 18 will reach end-of-life in the not-too-distant future, so moving to Node 20 ensures continued support and security updates. Going forward, keep an eye on new Node LTS releases (Node 22 is next, slated to be LTS in late 2025). Strapi v5 supports Node 22 as well, so the project should be ready for that when the time comes. Similarly, Next.js and other libs will evolve – always consult release notes when planning future upgrades.
* **Commit and inform the team:** Finally, after the upgrade is verified, commit all the changes (`.nvmrc`, package.json, Dockerfiles, etc.) to your repository. It’s helpful to communicate to your team that Node.js 20 is now the required version. Developers should run `nvm use 20` (or install Node 20 manually) to avoid any mismatch. With the `"engines"` field updated, some package managers will warn or refuse to run if the wrong Node version is used, which is a good safeguard.

By following this guide, the *Unlocked Dashboard* project should now run smoothly on **Node.js 20**. You have updated all relevant files, ensured dependencies are compatible, and tested the application thoroughly. Enjoy the benefits of Node 20, and happy coding!

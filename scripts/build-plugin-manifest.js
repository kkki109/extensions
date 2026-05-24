name: Publish Plugins

on:
  push:
    branches:
      - main
      - master
    paths:
      - 'plugins/**'
      - 'public/**'
      - 'scripts/**'
      - '.github/workflows/publish-plugins.yml'

concurrency:
  group: ${{ github.workflow }}
  cancel-in-progress: true

jobs:
  publish:
    name: Publish Plugins
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Dependencies
        run: npm install --ignore-scripts

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email 41898282+github-actions[bot]@users.noreply.github.com

      # ⚙️ PASO NUEVO: Compilar los archivos .ts a .js antes de armar la lista
      - name: Compile TS Plugins
        run: npm run build
        shell: bash

      # 🚀 Ejecutar el generador del catálogo (ahora sí leerá los archivos compilados)
      - name: Build Plugins Manifest
        run: node scripts/build-plugin-manifest.js
        shell: bash
        
      # 🛡️ Despliegue seguro a master
      - name: Deploy to GitHub Pages or Commit Files
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          if [ -d ".dist" ]; then
            git add .dist/
            git commit -m "Update plugins catalog" && git push origin master || echo "No hay cambios para subir"
          else
            echo "Error: La carpeta .dist no se creó." && exit 1
          fi
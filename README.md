# 🐾 PAWKA Back-End

**Pawka** est une application mobile destinée aux propriétaires d’animaux, leur permettant d’évaluer rapidement la qualité des produits alimentaires pour leurs compagnons à partir d’un simple scan de code-barres.

Ce repository contient le backend de l’application, développé en Node.js avec Express, et connecté à une base de données PostgreSQL. Il fournit une API REST permettant :

- le scan de produits via l’API OpenPetFoodFacts,

- l’analyse intelligente des ingrédients avec OpenAI,

- la gestion des utilisateurs et de leur historique de scans,

- la sécurisation de l’accès via Clerk (authentification et rôles),

- le stockage des évaluations nutritionnelles en base.

---
## Installation

1. Clone this repository

2. Navigate to the project folder

3. Install dependencies :
    ```
    npm install
    ```
4. Setup the database:

- In you localhost, create a new DB pawka_dev

- Clone .env.dist file, rename the copy to .env. Adjust the DB settings to correspond to your local configuration.

- In this file `/src/utils/sequelize.js`, uncomment this part to recreate an empty one:

    ```
    // await sequelize.sync({
    //   alter: true,
    // });
    ```

## Usage

- Start Backend Server
    ```
    npm run dev
    ```
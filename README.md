# FRVtubers Feed Generator

FRVtubers Feed Generator is a Feed Generator service designed for the French VTuber community. This project generates custom feeds based on specific keywords related to French VTubers, such as `#vtuberfr`, `#frvtubers`, and others.

The goal is to create a community-driven, open-source feed that aggregates posts related to VTubers in the French language and the French VTuber scene.

[Full Documentation on AT Protocol Feed Generators](https://atproto.com/specs/at-uri-scheme)

## 🌈 Demo
A demo of the FRVtubers feed generator will be available soon! For now, you can access the feed generator at the following endpoint:  
[FRVtubers Feed Generator](https://your-feed-url.com)

## 📦 Installation

You can run this feed generator locally by following these steps.

1. Clone the repository:

    ```
    git clone https://github.com/yourusername/frvtubers-feed-generator.git
    cd frvtubers-feed-generator
    ```

2. Install dependencies:

    Using Yarn:
    ```
    yarn install
    ```

    Using NPM:
    ```
    npm install
    ```

    Using PNPM:
    ```
    pnpm install
    ```

3. Run the server:

    ```
    yarn start
    ```

    This will start the server on port 3000 (or the port defined in `.env`), and you can access the feed at `http://localhost:3000`.

## 🌸 Special Thanks

Huge thanks to the [Bluesky team](https://github.com/bluesky) for their work on the AT Protocol and Feed Generators.

## 🧑‍💻 Features

- **Custom Feed Generation**: Based on keywords like `#vtuberfr`, `#frvtubers`, `+frvtuber`, `#vtuber`, and others.
- **Open-Source**: The project is open-source, and anyone can contribute.
- **Support for French VTubers**: The feed is designed to provide content related to VTubers in the French language.
- **Live Updates**: Subscribes to the firehose and dynamically updates the feed based on recent posts.

## 🚀 How It Works

1. **Indexing Logic**: The server subscribes to the feed using the firehose and listens for posts that match the defined keywords: `#vtuberfr`, `#frvtubers`, etc.
2. **Feed Generation**: The server returns a list of posts that contain these keywords. Posts are returned in a skeleton format with metadata (such as reasons for inclusion).
3. **Request and Response**: When a user requests the feed, it returns a list of URIs for relevant posts, which are then hydrated by the user's client.

## 🔧 Custom Algorithm for FRVtubers Feed

The algorithm behind this feed simply filters for posts that contain one of the following keywords:

- `#vtuberfr`
- `#frvtubers`
- `#frvtuber`
- `vtubersfr`
- `#vtubersfr`
- `+ langue fr vtubers`
- `#vtubers`

This ensures that users are only presented with posts related to French VTubers, making the feed a unique resource for fans and creators in the community.

### Feed Generation Algorithm
To create the feed, the algorithm is implemented in the `src/algos/frvtubers.ts` file. It subscribes to the firehose and checks if posts contain any of the above keywords.

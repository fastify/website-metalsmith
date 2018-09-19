# fastify-website

[![CircleCI](https://circleci.com/gh/fastify/website.svg?style=shield)](https://circleci.com/gh/fastify/website)

This project is used to build the website for [fastify web framework](https://github.com/fastify/fastify) and publish it online.


## Requirements

 - Node 8.3.0+
 - Install dependencies with `npm install`


## Build

To trigger the build of the website you just need to run:

```bash
npm run build
```

This will execute all the steps necessary to create a build (static website).

If you are developing you can run:

```bash
npm start
```

This will trigger the build and also start a live server that will allow you to visualize the changes you are performing on the website.

(note that every time you make a change to the assets that constitutes the content of the website you will need to launch `npm run build:website` to trigger a rebuild)


## Build steps

In case you are interested in knowing more about how the build process works, here are the main steps that are performed during its execution:

  1. **Cleanup**: removes temporary resources that might have created from a previous build
  2. **Temp folders creation**: Creates the needed folders for the build process
  3. **Get releases**: uses the GitHub APIs to download the latest releases of Fastify so that the documentation pages can be regenerated dynamically.
  4. **Process releases**: processes the releases creating all the necessary dynamic files that are derivate from the original fastify releases (mostly used to generate and process documentation pages)
  5. **Website generation**: uses [Metalsmith](http://www.metalsmith.io/) to compile a static version of the website.

Checkout the [Package scripts](package.json) to understand which files trigger these actions in case you want to have a look at the code for any of the steps described above.


## Publishing as GitHub pages

The website is published automatically Circle CI using GitHub pages (branch `gh-pages`).

Every time there's a change on master, if the build was created successfully, then it is automatically published on GitHub Pages.

In order for this to work, Circle CI will need to be configured correctly providing all the necessary environment variables:

 - `DOMAIN`: the custom domain to be used in GitHub pages (`www.fastify.io`)
 - `GH_EMAIL`: the email of the GitHub user authorized in CircleCi to push to the `gh-pages` branch
 - `GH_NAME`: the username of the GitHub user authorized in CircleCi to push to the `gh-pages` branch
 - `GH_TOKEN`: (optional) a GitHub personal access token for the user specified in `GH_NAME`.
   If this is present the API calls to GitHub will be authenticated.
 - `CLOUDFLARE_EMAIL`: the email of the CloudFlare account
 - `CLOUDFLARE_AUTH_KEY`: the authorization key to perform API calls on CLoudFlare APIs
 - `CLOUDFLARE_ZONE`: the ID of the CloudFlare Zone associated to the current domain

## Contributing

Everyone is very welcome to contribute to this project.
You can contribute just by submitting bugs or suggesting improvements by
[opening an issue](/../../issues) or by [sending a pull request](/../../pulls).


## License
Licensed under [MIT License](LICENSE). © [The Fastify team](https://github.com/fastify/fastify#team).

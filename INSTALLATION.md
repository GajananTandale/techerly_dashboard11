## Tcherly Installation

### Prerequisites
Before you get started please follow the steps below:
1. Download and install [Node.js](https://nodejs.org/dist/latest-v12.x/)
2. Download and setup [MongoDB](https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-4.4.10-signed.msi)
3. Install [Yarn](https://classic.yarnpkg.com/en/docs/install)
> `npm install --global yarn`

### Getting started
Follow the steps one after the another to configure the application

1. Clone this repository to your workspace directory ([Help](https://docs.github.com/en/authentication/connecting-to-github-with-ssh))

`git clone git@github.com:localhoax/debe.git`
1. Navigate to the directory
> `cd debe`
3. Install server dependencies
> `yarn`
4. Configure server environment variables
> `cp .env.example .env`
5. Navigate to the `client` folder
> `cd client`
6. Install client dependencies
> `yarn`
7. Configure client environment variables
> `cp .env.example .env`


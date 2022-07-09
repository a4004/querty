# Querty OSS 🌐
Free and open-source all-in-one Discord bot framework with extensive plugin support. 

<p>
  <img alt="Build Passing" src="https://img.shields.io/static/v1?label=Build&message=Passing&color=limegreen&style=flat-square&logo=typescript&logoColor=white"/>
  <img alt="Beta" src="https://img.shields.io/static/v1?label=Latest&message=1.0.1-r2&color=green&style=flat-square"/>
</p>

<p>
<a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://github.com/a4004/a4004/raw/main/www/svg/ts.svg"/></a>
<a href="https://262.ecma-international.org/6.0/"><img alt="JavaScript" src="https://github.com/a4004/a4004/raw/main/www/svg/js.svg"/></a>
&nbsp;
<a href="https://nodejs.org/"><img alt="NodeJS" src="https://github.com/a4004/a4004/raw/main/www/svg/node.svg" width=auto height=36/></a>
&nbsp;
<a href="https://code.visualstudio.com/"><img alt="Visual Studio Code" src="https://github.com/a4004/a4004/raw/main/www/svg/vsc19.svg"/></a>
<a href="https://www.microsoft.com/en-us/windows/"><img alt="Windows" src="https://github.com/a4004/a4004/raw/main/www/svg/w11.svg"/></a>
</p>
  
## What's New 🆕
- Say hello to **TypeScript**!
- Querty plugins are more interactive such as the new 00:00 game (previously known as "noon").
- Dynamic (external) plugin support allows small modules to be inserted with relative ease and time without compilation.
- "Owl OSS" ➡️ "Querty OSS" (Rebrand)

## What's Next 📚
- Over the next fews weeks the [wiki](https://github.com/a4004/querty/wiki) for this repository is going to be populated with useful information about the project and its structure as well as a guide on how to create modules and internal/external plugins.

## Getting Started 🌀
1. You'll need to have [Node.js](https://nodejs.org/) installed on your host before you can do anything.
2. Clone this repo using the `git` command or using the GitHub web interface.
```sh
$ git clone https://github.com/a4004/querty
```
3. Inside the `querty` folder, execute `npm install` to install all the packages required by *Querty*.
4. Before you can use the bot you'll need to configure it to work with a given Discord application. You can set one up on the [Discord Developer Portal](https://discord.com/developers/applications) and the configure the `src/settings/static.json` file with the required credentials.
```json
{
    "bot_token": "<bot token here>",
    "client_id": "<client id here, optional>",
    "client_secret": "<client secret here, optional>",
    "admins": ["<admin 1 here, recomennded>", "..."]
}
```
5. Run the following command in the `querty` directory to compile the TypeScripts source. You'll find executable JavaScript in the `build` folder.
```sh
$ npx tsc
```

⚠️ Only run `npx tsc` once as it will overwrite all files in the `build` folder including any dynamically generated/modified configuration files such as `zerozero.json`. If you need to later add-in a module, make a seperate copy of the project, build and then manually copy the generated files into the original build
and execute the `index.js` file again.

6. To start the bot, run:
```sh
$ node build/index.js
```

## Legal 🧻
The software is provided **as is** without warranty of any kind. The developer, **shall not**, under **any circumstance** bear any form of **responsibility/authority or involvement** over consequences as a result of the operation/distribution/modification or other interaction with this open-source software.

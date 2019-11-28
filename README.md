# akamai-deobfuscator

A tool to help you to recover function and property names to better reverse-engineer Akamai scripts.

#### Before Deobfuscation
![Before deobfuscation](https://i.imgur.com/mfDpFCy.png)

#### After Deobfuscation
![After deobfuscation](https://i.imgur.com/uncoeak.png)
### Usage
Install the dependencies  start the script.

```sh
$ cd akamai-deobfuscator
$ npm install
$ npn run start
```

Optionally you can provide your own Akamai script as an argument

```sh
$ npm run start <YOUR URL HERE>
```

The output is in `/out/output.js`
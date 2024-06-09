# 🧙‍♂️ Ezlo.js - AI powered article generator

Ezlo.js is a simple to use CLI utility which interfaces with OpenAI APIs on your behalf to generate articles for your niche.

- [Installation](#installation)
- [Usage](#usage)
- [I do not use Hugo](#i-do-not-use-hugo)
- [Made with Ezlo.js](#made-with-ezlojs)

## Installation

```
npm install -g ezlo.js
```

## Usage

### Step 1 - Configure the tool

```
ezlo config
```

Make sure you have the following:
- Absolute path to your Hugo blog (if you don't have this, [see below](#i-do-not-use-hugo).
- OpenAI key on a credited developer account.
- A simple description of your niche (ie: A blog about... how AI can help digital marketers)

### Step 2 - Create a new draft

```
ezlo draft new
```

### Step 3 - Generate some ideas for articles

```
ezlo ideas gen
```

### Step 4 - List your ideas

```
ezlo ideas
```

Ideas will be listed with a number. Take note of the `[idea_index]` you want to generate a post for.

### Step 5 - Generate a thesis statement

```
ezlo thesis [idea_index]
```

### Step 6 - Generate the article body

```
ezlo body
```

### Step 7 - Generate a banner image

```
ezlo banner gen
```

### (Optional) Step 8 - Publish to Hugo blog

```
ezlo publish
```

## I do not use Hugo

No problem. Your generated articles and banner images are stored on disk, an easy way to access them is by running:

```
ezlo draft
```

This will print the full file path of the draft markdown files. The articles and banner images share the same file name, just `.md` or `.png`.

## Made with Ezlo.js

<a href="https://ezlo.ai" target="_blank"><img alt="Ezlo.ai" src="https://github.com/saricden/ezlo.js/assets/7004280/3021ab9d-e845-4ebb-8180-22ddde5bcf33"></a>


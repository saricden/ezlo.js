#!/usr/bin/env node

const process = require('process');
const OpenAI = require('openai');
const SimplDB = require('simpl.db');
const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const readline = require('readline-sync');
require('dotenv').config()

const db = new SimplDB();
const openai = new OpenAI({
  apiKey: db.get('apiKey'),
});
const arg1 = process.argv[2];
const arg2 = process.argv[3];

const notConfigured = !(db.get('apiKey') && db.get('sitePath'));

if (!arg1 && !arg2) {
  console.log('Ezlo.js - AI powered article generator.');
  console.log('Usage: ezlo [command] [argument]');
  console.log('Commands:');
  console.log('  config - Configure OpenAI API key, Hugo site path and blog niche.');
  console.log('');
  console.log('  draft new - Create a new draft.');
  console.log('  draft - Print the path to the draft file.');
  console.log('  draft edit - Open the draft file in nano.');
  console.log('');
  console.log('  ideas gen - Generate 3 new ideas.');
  console.log('  ideas - List previously generated ideas.');
  console.log('  ideas clear - Clear all ideas from the database.');
  console.log('');
  console.log('  thesis [idea_index] - Set the active idea and generate a thesis.');
  console.log('');
  console.log('  body - Generate an article body based on the thesis.');
  console.log('');
  console.log('  banner gen - Generate a banner image based on the active idea.');
  console.log('  banner - Preview the generated banner.');
  console.log('');
  console.log('  audio - Start the audio generator tool (very beta).');
  return;
}
else if (arg1 === 'config') {
  const sitePath = readline.question('Hugo site path: ');
  const apiKey = readline.question('OpenAI API key: ', { hideEchoBack: true });
  const blogNiche = readline.question('A niche blog about... ');

  db.set('sitePath', sitePath);
  db.set('apiKey', apiKey);
  db.set('blogNiche', blogNiche);

  console.log('Config saved.');
  return;
}
else if (notConfigured) {
  console.log('Please configure your OpenAI API key and Hugo site path first.');
  return;
}
if (arg1 === 'ideas' && arg2 === 'clear') {
  db.set('prevIdeas', []);
  console.log('All ideas cleared from the database.');
  return;
}
else if (arg1 === 'ideas' && arg2 === 'gen') {
  generateIdeas();
  return;
}
else if (arg1 === 'ideas') {
  const ideas = db.get('prevIdeas');

  if (ideas.length === 0) {
    console.log('No ideas found in the database.');
    return;
  }
  else {
    for (let i = 0; i < ideas.length; i++) {
      console.log(i + ': ' + ideas[i]);
    }
  }
  return;
}
else if (arg1 === 'draft' && arg2 === 'new') {
  const filename = Math.random().toString(36).substring(2, 15) + '.md';
  const path = require('path').resolve(__dirname, filename);

  fs.writeFile(path, '', (err) => {
    if (err) throw err;
    console.log(`Draft created: ${path}`);
  });
  
  db.set('draftPath', path);
  console.log(`Draft path set to: ${path}`);
  return;
}
else if (arg1 === 'draft' && arg2 === 'edit') {
  const draftPath = db.get('draftPath');
  
  if (!draftPath) {
    console.log('No draft found in the database.');
  }
  else {
    execSync(`nano ${draftPath}`, { stdio: 'inherit' });
  }
  return;
}
else if (arg1 === 'draft') {
   const path = db.get('draftPath');

   if (!path) {
     console.log('No draft found in the database.');
   }
   else {
     console.log(path);
   }
   return;
}
else if (arg1 === 'thesis' && Number.isInteger(parseInt(arg2))) {
  const ideaIndex = parseInt(arg2);
  let allIdeas = db.get('prevIdeas');
  const idea = allIdeas[ideaIndex];
  
  if (!idea) {
    console.log('Idea not found in the database.');
  }
  else {
    console.log(`Idea: "${idea}"`);
    console.log('Generating thesis...');

    allIdeas[ideaIndex] = `✅ ${idea}`;
    db.set('prevIdeas', allIdeas);
    db.set('draftIdea', idea);

    generateThesis(idea);
  }
  return;
}
else if (arg1 === 'thesis') {
  const thesis = db.get('draftThesis');
  
  if (!thesis) {
    console.log('No thesis found in the database.');
  }
  else {
    console.log(thesis);
  }
  return;
}
else if (arg1 === 'body') {
  const thesis = db.get('draftThesis');

  if (!thesis) {
    console.log('No thesis found in the database.');
  }
  else {
    console.log(`Thesis: "${thesis}"`);
    console.log('Generating article body...');

    generateBody(thesis);
  }
  return;
}
else if (arg1 === 'banner' && arg2 === 'gen') {
  const idea = db.get('draftIdea');
  let allIdeas = db.get('prevIdeas');
  const ideaIndex = allIdeas.indexOf(idea);
  
  if (!idea) {
    console.log('Idea not found in the database.');
  }
  else {
    allIdeas[ideaIndex] = `🖼️ ${idea}`;
    db.set('prevIdeas', allIdeas);

    generateBanner();
  }
  return;
}
else if (arg1 === 'banner') {
  const banner = db.get('draftBanner');

  if (!banner) {
    console.log('No banner found in the database.');
  }
  else {
    execSync(`open "" "${banner}"`, {
      stdio: 'inherit'
    });
  }
  return;
}
else if (arg1 === 'publish') {
  const sitePath = db.get('sitePath');
  const draftPath = db.get('draftPath');
  const draftBanner = db.get('draftBanner');
  const draftIdea = db.get('draftIdea');
  const slug = draftIdea.replace(/ /g, '-').toLowerCase();
  
  const targetPath = `${sitePath}/content/posts/${slug}.md`;
  const targetBanner = `${sitePath}/static/${slug}.png`;
  
  fs.copyFileSync(draftPath, targetPath);
  fs.copyFileSync(draftBanner, targetBanner);

  let article = fs.readFileSync(targetPath, 'utf8');
  const frontMatter = `---\ndate: ${new Date().toISOString()}\ntitle: "${draftIdea}"\nurl: ${slug}\ncover:\n  image: /${slug}.png\n---\n\n`;

  article = frontMatter + article;
  
  fs.writeFileSync(targetPath, article);
  console.log(`Article published: ${targetPath}`);
}
else if (arg1 === 'audio') {
  const express = require('express');
  const bodyParser = require('body-parser');
  const app = express();
  const port = 3000;

  app.use(express.static('audio_generator'));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post('/generate', async (req, res) => {
    const text = req.body.text;

    if (!text) {
      res.send('<audio controls id="audio"></audio>');
    }
    else {
      await generateAudio(text);

      const audio = `<audio controls id="audio"><source src="./audio.mp3"></audio>`;
      res.send(audio);
    }
  });


  app.listen(port, () => {
    require("openurl").open("http://localhost:" + port);
    console.log(`Example app listening on port ${port}`);
  });
  return;
}

async function generateIdeas() {
  const prevIdeas = db.get('prevIdeas');
  const prompt = `Present 3 article ideas for a niche blog post about ${db.get('blogNiche')}. Do not repeat any ideas used previously.\n\nPreviously used ideas:\n${prevIdeas.join('\n')}`;
  console.log('Fetching ideas from OpenAI...');
  const completion = await openai.chat.completions.create({
    messages: [
      {"role": "system", "content": "You are a blog writer. Your response must be a JSON array contained in a key called ideas. Each idea should be a string."},
      {"role": "user", "content": prompt}
    ],
    model: "gpt-4o",
    response_format: { type: "json_object" }
  });

  console.log(completion);

  const {ideas} = JSON.parse(completion.choices[0].message.content);

  if (Array.isArray(ideas)) {
    db.set('prevIdeas', [
      ...prevIdeas,
      ...ideas
    ]);

    console.log('Ideas added to database.');
  }
}

async function generateThesis(idea) {
  const prompt = `Create a thesis statement for a niche blog about ${db.get('blogNiche')}. Use the idea: "${idea}". The thesis must contain 3 unique key points that support the thesis. Write in plain text and do not use markdown. Do not repeat the idea verbetim.`;
  console.log('Fetching thesis from OpenAI...');
  const completion = await openai.chat.completions.create({
    messages: [
      {"role": "system", "content": "You are a blog writer."},
      {"role": "user", "content": prompt}
    ],
    model: "gpt-4o"
  });

  console.log(completion);

  const {content} = completion.choices[0].message;
  
  const path = db.get('draftPath');
  
  if (path) {
    fs.appendFile(path, content, (err) => {
      if (err) throw err;
      console.log('Thesis appended to draft.');
    });
  }

  db.set('draftThesis', content);
  console.log('Thesis set in database.');
}

async function generateBody(thesis) {
  const prompt = `Create an article body explaining the thesis. Use the thesis: "${thesis}". Write in plain text and do not use markdown or section headers. Include a summary at the end.`;
  console.log('Fetching article body from OpenAI...');
  const completion = await openai.chat.completions.create({
    messages: [
      {"role": "system", "content": "You are a blog writer."},
      {"role": "user", "content": prompt}
    ],
    model: "gpt-4o"
  });
  
  console.log(completion);

  const {content} = completion.choices[0].message;
  
  const path = db.get('draftPath');
  
  if (path) {
    fs.appendFile(path, content, (err) => {
      if (err) throw err;
      console.log('Article body appended to draft.');
    });
  }
}

async function generateBanner() {
  const idea = db.get('draftIdea');
  const prompt = `Create a banner image for a blog post about ${idea}. The image should be in PNG format and have a resolution of 1792x1024 pixels. Do not use text at all.`;
  console.log('Generating banner image using OpenAI...');
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1792x1024",
  });
  
  console.log(response);

  const image_url = response.data[0].url;
  const path = db.get('draftPath').replace(/\.md$/, '.png');

  const file = fs.createWriteStream(path);
  https.get(image_url, (response) => {
    response.pipe(file);
  });

  db.set('draftBanner', path);
  console.log(`Banner set in database: ${path}`);
}

async function generateAudio(input) {
  const path = require('path');
  const speechFile = path.resolve("./audio_generator/audio.mp3");

  const mp3 = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: "onyx",
    input
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}
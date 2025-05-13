const fs = require('fs');
const path = require('path');

async function downloadQuestion(externalId) {
  const response = await fetch("https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-question", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      "content-type": "application/json",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "Referer": "https://satsuitequestionbank.collegeboard.org/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": JSON.stringify({ external_id: externalId }),
    "method": "POST"
  });

  return await response.json();
}

async function saveQuestion(externalId, question) {
  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  // Save the question to a file
  const filePath = path.join(dataDir, `${externalId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(question, null, 2));
  console.log(`Question saved to ${filePath}`);
}

function questionFileExists(externalId) {
  const filePath = path.join(__dirname, 'data', `${externalId}.json`);
  return fs.existsSync(filePath);
}

async function processQuestion(externalId) {
  try {
    if (questionFileExists(externalId)) {
      console.log(`Skipping question ${externalId} - file already exists`);
      return;
    }

    console.log(`Downloading question ${externalId}...`);
    const question = await downloadQuestion(externalId);
    await saveQuestion(externalId, question);
  } catch (error) {
    console.error(`Error processing question ${externalId}:`, error);
  }
}

function getExternalIdsFromFile() {
  const filePath = path.join(__dirname, 'test1.fresh.json');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const questions = JSON.parse(fileContent);
  return questions.map(q => q.external_id);
}

async function main() {
  const externalIds = getExternalIdsFromFile();
  console.log(`Starting to process ${externalIds.length} questions...`);

  for (const externalId of externalIds) {
    await processQuestion(externalId);
  }

  console.log('All questions processed!');
}

// Call the main function
main();
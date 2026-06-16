// ==========================================
// CONFIGURATION (CHANGE THESE TO YOUR GITHUB DETAILS)
// ==========================================
const GITHUB_USERNAME = "Jessyfranky"; // e.g. "destinyfield"
const REPO_NAME = "school-website";             // e.g. "school-website"
const FILE_PATH = "content.json";
const BRANCH = "main"; // Or "master"

const API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;

// State
let siteData = {};
let fileSha = "";
let currentToken = "";

// DOM Elements
const authForm = document.getElementById('auth-form');
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const saveBtn = document.getElementById('save-to-github');
const statusText = document.getElementById('save-status');

// Handle Authentication
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  currentToken = document.getElementById('github-token').value.trim();
  
  // Test token by trying to fetch the JSON file
  try {
    const res = await fetch(API_URL, {
      headers: { "Authorization": `token ${currentToken}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      fileSha = data.sha;
      // Decode Base64 content from GitHub
      siteData = JSON.parse(decodeURIComponent(escape(atob(data.content))));
      
      populateForms();
      
      authView.classList.add('hidden');
      dashboardView.classList.remove('hidden');
    }  else {
      const errorData = await res.json();
      alert("GitHub Error: " + errorData.message);
      console.log(errorData);
    }
  } catch (error) {
    alert("Connection error: " + error.message);
  }
});

// Tab Switching
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.dashboard-panel').forEach(p => p.classList.remove('active-panel'));
    
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active-panel');
  });
});

// Populate HTML Forms with Data
function populateForms() {
  // Global
  document.getElementById('g-address').value = siteData.global.address || '';
  document.getElementById('g-email').value = siteData.global.email || '';
  document.getElementById('g-facebook').value = siteData.global.facebook || '';
  document.getElementById('g-hours').value = siteData.global.hours || '';
  document.getElementById('g-phones').value = siteData.global.phones.join(', ');

  // Home
  document.getElementById('h-years').value = siteData.home.metrics.years;
  document.getElementById('h-scholars').value = siteData.home.metrics.scholars;
  document.getElementById('h-commit').value = siteData.home.metrics.commitment;
  document.getElementById('h-values').value = siteData.home.metrics.values;
  document.getElementById('h-title').value = siteData.home.heroTitle;
  document.getElementById('h-img1').value = siteData.home.heroImages[0] || '';

  // About
  document.getElementById('a-vision').value = siteData.about.vision;
  document.getElementById('a-mission').value = siteData.about.mission;
  document.getElementById('a-name').value = siteData.about.directorName;
  document.getElementById('a-title').value = siteData.about.directorTitle;
  document.getElementById('a-message').value = siteData.about.directorMessage;
  document.getElementById('a-photo').value = siteData.about.aboutImage;

  // Admissions
  document.getElementById('ad-intro').value = siteData.admissions.introText;

  // Raw JSON (News, Gallery, Docs)
  // We stringify just the arrays so they can be edited freely
  const rawData = {
    news: siteData.news,
    gallery: siteData.gallery,
    documents: siteData.admissions.documents
  };
  document.getElementById('raw-json-editor').value = JSON.stringify(rawData, null, 2);
}

// Gather Data & Save to GitHub
saveBtn.addEventListener('click', async () => {
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  
  try {
    // 1. Gather all inputs back into the JSON object
    siteData.global.address = document.getElementById('g-address').value;
    siteData.global.email = document.getElementById('g-email').value;
    siteData.global.facebook = document.getElementById('g-facebook').value;
    siteData.global.hours = document.getElementById('g-hours').value;
    siteData.global.phones = document.getElementById('g-phones').value.split(',').map(s => s.trim());

    siteData.home.metrics.years = parseInt(document.getElementById('h-years').value);
    siteData.home.metrics.scholars = parseInt(document.getElementById('h-scholars').value);
    siteData.home.metrics.commitment = parseInt(document.getElementById('h-commit').value);
    siteData.home.metrics.values = parseInt(document.getElementById('h-values').value);
    siteData.home.heroTitle = document.getElementById('h-title').value;
    siteData.home.heroImages[0] = document.getElementById('h-img1').value;

    siteData.about.vision = document.getElementById('a-vision').value;
    siteData.about.mission = document.getElementById('a-mission').value;
    siteData.about.directorName = document.getElementById('a-name').value;
    siteData.about.directorTitle = document.getElementById('a-title').value;
    siteData.about.directorMessage = document.getElementById('a-message').value;
    siteData.about.aboutImage = document.getElementById('a-photo').value;

    siteData.admissions.introText = document.getElementById('ad-intro').value;

    // Parse the advanced JSON box
    const parsedRaw = JSON.parse(document.getElementById('raw-json-editor').value);
    siteData.news = parsedRaw.news;
    siteData.gallery = parsedRaw.gallery;
    siteData.admissions.documents = parsedRaw.documents;

    // 2. Encode for GitHub
    const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(siteData, null, 2))));

    // 3. PUT Request to Overwrite
    const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: {
        "Authorization": `token ${currentToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Admin CMS: Content update",
        content: encodedContent,
        sha: fileSha,
        branch: BRANCH
      })
    });

    if (response.ok) {
      const data = await response.json();
      fileSha = data.content.sha; // Update SHA for future saves
      saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
      statusText.innerHTML = "Vercel is rebuilding your site now. Wait 30 seconds.";
      setTimeout(() => { saveBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Save & Publish'; }, 3000);
    } else {
      throw new Error("GitHub API rejected the save.");
    }
    
  } catch (err) {
    alert("Save Failed. Ensure JSON in Advanced tab is valid. Error: " + err.message);
    saveBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Save & Publish';
  }
});
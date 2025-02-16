const asExact = document.getElementById("as-exact");
const asStarts = document.getElementById("as-starts");
const asAll = document.getElementById("as-all");
const asAny = document.getElementById("as-any");
const asNone = document.getElementById("as-none");
const asSubmit = document.getElementById("as-submit");
const asCreators = document.getElementById("as-creators");
const asExcludeCreators = document.getElementById("as-exclude-id");
const asAfter = document.getElementById("as-after");
const asBefore = document.getElementById("as-before");
const asHasImage = document.getElementById("as-hasImage");

const asExactCase = document.getElementById("as-exact-case");
const asStartsCase = document.getElementById("as-starts-case");
const asAllCase = document.getElementById("as-all-case");
const asAnyCase = document.getElementById("as-any-case");
const asNoneCase = document.getElementById("as-none-case");
const asCreatorsCase = document.getElementById("as-creators-case");
const asExcludeCreatorsCase = document.getElementById("as-exclude-id-case");

const asOutput = document.getElementById("advanced-search-output");
const asStats = document.getElementById("advanced-search-stats");
const asPageControls = document.getElementById("advanced-search-page");

const currentPageElement = document.getElementById("as-current-page");
const totalCountElement = document.getElementById("as-results-count");
const previousPageElement = document.getElementById("as-previous-page");
const nextPageElement = document.getElementById("as-next-page");

function numberWithCommas(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function generateResult(level) {
    const levelUrl = `https://grabvr.quest/levels/viewer/?level=${level.identifier}`;
    const levelCreators = (level?.creators || []).join(', ');
    const levelImageUrl = level?.images?.thumb?.key ? `https://grab-images.slin.dev/${level.images.thumb.key}` : '/img/thumbnail_error.png';

    const levelElement = document.createElement("div");
    levelElement.classList.add("as-card");

    const levelImageElement = document.createElement('img');
    const levelTitleElement = document.createElement('a');
    const levelCreatorsElement = document.createElement('span');
    
    levelImageElement.src = levelImageUrl;
    levelTitleElement.innerText = `${level.title}`;
    levelTitleElement.href = levelUrl;
    levelCreatorsElement.innerText = `${levelCreators}`;

    levelElement.appendChild(levelImageElement);
    levelElement.appendChild(levelTitleElement);
    levelElement.appendChild(levelCreatorsElement);

    asOutput.appendChild(levelElement);
}

let levelData = [];
let resultData = [];
let page = 0;

function updatePageControls() {
    const totalPages = Math.ceil(resultData.length / 100);
    currentPageElement.innerText = `Page ${page + 1} of ${totalPages}`;
    totalCountElement.innerText = `(${numberWithCommas(resultData.length)} results)`;

    previousPageElement.disabled = page == 0;
    nextPageElement.disabled = page == totalPages - 1;

    asPageControls.style.display = "flex";
}

function loadPage() {
    updatePageControls();

    let pageData = resultData.slice(page * 100, (page + 1) * 100);

    asOutput.innerHTML = '';
    for (const level of pageData) {
        generateResult(level);
    }
}

function loadStats() {
    const stats = {
        plays: 0
    }
    for (const level of resultData) {
        stats.plays += level.statistics?.total_played || 0;
    }
    asStats.innerText = `Total plays: ${numberWithCommas(stats.plays)}`;
}

function search() {
    let exactValue = asExact.value;
    let startsValue = asStarts.value;
    let allValue = asAll.value;
    let anyValue = asAny.value;
    let noneValue = asNone.value;
    let creatorsValue = asCreators.value;
    let excludeCreatorsValue = asExcludeCreators.value;
    const hasImageValue = asHasImage.checked;
    const afterValue = asAfter.value;
    const beforeValue = asBefore.value;

    const ExactCase = !asExactCase.checked;
    const StartsCase = !asStartsCase.checked;
    const AllCase = !asAllCase.checked;
    const AnyCase = !asAnyCase.checked;
    const NoneCase = !asNoneCase.checked;
    const CreatorsCase = !asCreatorsCase.checked;
    const ExcludeCreatorsCase = !asExcludeCreatorsCase.checked;

    if (ExactCase) exactValue = exactValue.toLowerCase();
    if (StartsCase) startsValue = startsValue.toLowerCase();
    if (AllCase) allValue = allValue.toLowerCase();
    if (AnyCase) anyValue = anyValue.toLowerCase();
    if (NoneCase) noneValue = noneValue.toLowerCase();
    if (CreatorsCase) creatorsValue = creatorsValue.toLowerCase();
    if (ExcludeCreatorsCase) excludeCreatorsValue = excludeCreatorsValue.toLowerCase();

    excludeCreatorsValue = excludeCreatorsValue.split(',').map(i => i.trim());

    let multipleCreators = creatorsValue.includes(',');
    if (multipleCreators) creatorsValue = creatorsValue.split(',').map(c => c.trim());

    let filteredData = [];

    for (const level of levelData) {
        const title = level?.title || '';
        const creators = (level?.creators || []).join(' ');
        const hasImage = level?.images?.thumb?.key ? true : false;
        const timestamp = level.update_timestamp || level.creation_timestamp || (level.identifier.split(':')[1] * 1000) || 0;

        let match = true;

        // title must be the same as exactValue
        if (exactValue && exactValue != '') {
            if ((ExactCase ? title.toLowerCase() : title) != exactValue) match = false;
        }
        // title must start with startsValue
        if (startsValue && startsValue != '') {
            if (!(StartsCase ? title.toLowerCase() : title).startsWith(startsValue)) match = false;
        }
        // title must include all words in allValue
        if (allValue && allValue != '') {
            if (allValue.split(' ').some(w => !(AllCase ? title.toLowerCase() : title).includes(w))) match = false;
        }
        // title must include any word in anyValue
        if (anyValue && anyValue != '') {
            if (!anyValue.split(' ').some(w => (AnyCase ? title.toLowerCase() : title).includes(w))) match = false;
        }
        // title must not include any word in noneValue
        if (noneValue && noneValue != '') {
            if (noneValue.split(' ').some(w => (NoneCase ? title.toLowerCase() : title).includes(w))) match = false;
        }
        // creators must include creatorsValue
        if (multipleCreators) {
            let includesACreator = false;
            for (const creator of creatorsValue) {
                if ((CreatorsCase ? (level?.creators || []).map(c => c.toLowerCase()) : (level?.creators || [])).includes(creator)) includesACreator = true;
            }
            if (!includesACreator) match = false;
        } else {
            if (creatorsValue && creatorsValue != '') {
                if (!(CreatorsCase ? creators.toLowerCase() : creators).includes(creatorsValue)) match = false;
            }
        }
        // Exclude creator ids
        if (excludeCreatorsValue.includes(level.identifier.split(':')[0])) match = false;
        // must have an image if hasImageValue is set
        if (hasImageValue) {
            if (!hasImage) match = false;
        }
        // timestamp must be after afterValue
        if (afterValue && afterValue != '') {
            if (timestamp <= new Date(afterValue).getTime()) match = false;
        }
        // timestamp must be before beforeValue
        if (beforeValue && beforeValue != '') {
            if (timestamp >= new Date(beforeValue).getTime()) match = false;
        }

        if (match) filteredData.push(level);
    }

    resultData = filteredData;
    page = 0;
    loadPage();
    loadStats();
}

async function getLevels() {
    const url = "/stats_data/all_verified.json";
    const response = await fetch(url);
    const data = await response.json();
    levelData = data;
}

getLevels();
asSubmit.addEventListener('click', search);
previousPageElement.addEventListener('click', () => { page--; loadPage(); });
nextPageElement.addEventListener('click', () => { page++; loadPage(); });
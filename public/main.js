document.getElementById('Home').addEventListener('click', () => {
    window.location.href = 'index.html';
});
document.getElementById('Docs').addEventListener('click', () => {
    window.location.href = 'docs.html';
});
document.getElementById('Stats').addEventListener('click', () => {
    window.location.href = 'stats.html';
});
document.getElementById('Other-Tools').addEventListener('click', () => {
    window.location.href = 'tools.html';
});
if (window.location.href.includes('index.html') || document.title == 'Grab Tools | .index | twhlynch') {
    document.getElementById('editor').addEventListener('click', () => {
        window.location.href = 'editor.html';
    });
}

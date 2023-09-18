document.getElementById('Home').addEventListener('click', () => {
    window.location.href = 'index.html';
});
document.getElementById('List').addEventListener('click', () => {
    window.location.href = 'list.html';
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
    document.getElementById('cheat').addEventListener('click', () => {
        window.location.href = 'cheat-sheet.html';
    });
}

function deprecate(path) {
  document.body.innerHTML += `
    <div class="blocker" id="deprecated-popup">
        <div class="deprecated-popup">
            <div class="info">
                <p>
                    This page is deprecated. The new version at grabvr.tools will replace it.
                </p>
            </div>
            <div class="buttons">
                <button id="deprecated-use-anyway">use anyway</button>
                <a href="https://grabvr.tools/${path}">grabvr.tools</a>
            </div>
        </div>
    </div>
  `;

  document.getElementById("deprecated-use-anyway").onclick = () => {
    document.getElementById("deprecated-popup").remove();
  };
}

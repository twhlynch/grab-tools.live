let bar = document.getElementById("search-bar");
let submit = document.getElementById("search-button");
let output = document.getElementById("search-output");

submit.addEventListener("click", function (event) {
    let search = bar.value;
    if (search.length > 0) {
        let title = document.getElementById("search-title");
        let description = document.getElementById("search-description");
        let creators = document.getElementById("search-creators");
        fetch("stats_data/all_levels1.json")
            .then((response) => response.json())
            .then((data) => {
                data.forEach((item) => {
                    if (title.checked) {
                        try {
                            if (item.title.includes(search)) {
                                output.innerHTML += `<div class="search-item"><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a></div>`;
                            }
                        } catch {}
                    }
                    if (description.checked) {
                        try {
                            if (item.description.includes(search)) {
                                output.innerHTML += `<div class="search-item"><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a></div>`;
                            }
                        } catch {}
                    }
                    if (creators.checked) {
                        try {
                            if (item.creators.join().includes(search)) {
                                output.innerHTML += `<div class="search-item"><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a></div>`;
                            }
                        } catch {}
                    }
                });
            });
        fetch("stats_data/all_levels2.json")
            .then((response) => response.json())
            .then((data) => {
                data.forEach((item) => {
                    if (title.checked) {
                        try {
                            if (item.title.includes(search)) {
                                output.innerHTML += `<div class="search-item"><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a></div>`;
                            }
                        } catch {}
                    }
                    if (description.checked) {
                        try {
                            if (item.description.includes(search)) {
                                output.innerHTML += `<div class="search-item"><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a></div>`;
                            }
                        } catch {}
                    }
                    if (creators.checked) {
                        try {
                            if (item.creators.join().includes(search)) {
                                output.innerHTML += `<div class="search-item"><a href="https://grabvr.quest/levels/viewer/?level=${item["identifier"]}">${item["title"]}</a></div>`;
                            }
                        } catch {}
                    }
                });
            });
    }
});

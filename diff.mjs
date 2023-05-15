import fs from 'fs';
import fetch from 'node-fetch';

var fullData = [];

var arrayData = [];

function getLevels(stamp) {
  var arr = [];
  fetch(`https://api.slin.dev/grab/v1/list?max_format_version=100&type=ok&page_timestamp=${stamp}`)
      .then((response) => response.json())
      .then(data => {
          arr.push(...data);
          fullData = fullData.concat(data);
          fs.writeFileSync('stats-data.json', JSON.stringify(fullData, null, 2));
          console.log(data);
          console.log(fullData);
          var promises = [];
          arr.forEach(item => {
              if (item["statistics"]["difficulty"] == 0) {
                  let id = item["identifier"].replace(":", "/");
                  promises.push(
                      fetch("https://api.slin.dev/grab/v1/statistics/" + id)
                      .then((response) => response.json())
                      .then(data => {
                          if (data["finished_count"] == 0) {
                              var timestampInMilliseconds = item["creation_timestamp"];
                              var timeElapsedInSeconds = Math.floor((Date.now() - timestampInMilliseconds) / 1000);
                              var timeElapsedInMinutes = Math.floor(timeElapsedInSeconds / 60);
                              var timeElapsedInHours = Math.floor(timeElapsedInMinutes / 60);
                              var timeElapsedInDays = Math.floor(timeElapsedInHours / 24);
                              if (timeElapsedInDays > 0) {
                                  var time = `${timeElapsedInDays} days`;
                              } else if (timeElapsedInHours > 0) {
                                  var time = `${timeElapsedInHours} hours`;
                              } else if (timeElapsedInMinutes > 0) {
                                  var time = `${timeElapsedInMinutes} minutes`;
                              } else {
                                  var time = `${timeElapsedInSeconds} seconds`;
                              }
                              return {
                                  "title": item["title"],
                                  "plays": data["total_played_count"],
                                  "link": "https://grabvr.quest/levels/viewer?level=" + item["identifier"],
                                  "age": time
                              };
                          }
                      })
                  );
              }
          });

          Promise
              .all(promises)
              .then(levels => {
                  var hardest = levels.filter(level => level != undefined);
                  levels.forEach(item => {
                      if (item != undefined) {
                          console.log({"item": item});
                            var newData = {
                              "plays": item["plays"].toString(),
                              "link": item["link"],
                              "title": item["title"],
                              "age": item["age"]
                            };
                            arrayData.push(newData);
                      }
                  });
                  fs.writeFileSync('diff.json', JSON.stringify(arrayData, null, 2));
                  console.log({"data": arrayData});
                  if (arr[arr.length - 1]["page_timestamp"]) {
                      let newStamp = arr[arr.length - 1]["page_timestamp"];
                      getLevels(newStamp);
                  }
            });
      });
}

getLevels("");



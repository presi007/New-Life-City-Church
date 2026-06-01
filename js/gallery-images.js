(function () {
  "use strict";

  var base = "../assets/Gallery%20Website/";
  var images = [
    base + "2.jpg",
    base + "3.jpg",
    base + "4.jpg",
    base + "5.jpg",
    base + "6.jpg",
    base + "7.jpg",
    base + "8.jpg",
    base + "9.jpg",
    base + "10.jpg",
    base + "11.jpg",
    base + "12.jpg",
    base + "13.jpg",
    base + "14.jpg",
    base + "15.jpg",
    base + "16.jpg",
    base + "17.jpg",
    base + "18.jpg",
    base + "19.jpg",
    base + "20.jpg",
    base + "21.jpg",
    base + "Pastor%20Randeep.jpg",
    base + "Pastor%20Anushree.jpg"
  ];

  var grid = document.getElementById("gallery-grid");
  if (!grid) return;

  images.forEach(function (src, i) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gallery-item reveal";
    btn.setAttribute("data-lightbox", "");
    btn.setAttribute("data-full", src);
    btn.setAttribute("aria-label", "View image larger");

    var img = document.createElement("img");
    img.src = src;
    img.alt = "New Life City Church — gallery photo " + String(i + 1);
    img.loading = i < 12 ? "eager" : "lazy";

    btn.appendChild(img);
    grid.appendChild(btn);
  });
})();

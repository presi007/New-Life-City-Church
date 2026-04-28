(function () {
  "use strict";

  var images = [
    "../assets/Gallery/3.jpg",
    "../assets/Gallery/10.jpg",
    "../assets/Gallery/11.jpg",
    "../assets/Gallery/12.jpg",
    "../assets/Gallery/13.jpg",
    "../assets/Gallery/15.jpg",
    "../assets/Gallery/22.jpg",
    "../assets/Gallery/32.jpg",
    "../assets/Gallery/DSC01562.jpg",
    "../assets/Gallery/DSC02525.jpg",
    "../assets/Gallery/DSC02651.jpg",
    "../assets/Gallery/DSC04255.jpg",
    "../assets/Gallery/DSC04413.jpg",
    "../assets/Gallery/DSC04488.jpg",
    "../assets/Gallery/DSC05519.jpg",
    "../assets/Gallery/DSC05523.jpg",
    "../assets/Gallery/DSC06623.jpg",
    "../assets/Gallery/DSC09905.jpg",
    "../assets/Gallery/DSC09999.jpg",
    "../assets/Gallery/pastorrandeep.jpg"
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


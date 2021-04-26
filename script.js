document.addEventListener("DOMContentLoaded", function () {
  const linkInput = document.getElementById("short-input");
  const linksContainer = document.getElementById("links-container");
  const linkBtn = document.getElementById("short-btn");

  linkBtn.addEventListener("click", shortenLink);

  async function shortenLink() {
    const link = inputValidation(linkInput);
    if (link !== false) {
      linkInput.value = "";
      saveLink(updateBox(await getShortenedLink(drawBox(link))));
    }
  }

  function getLinksFromStorage() {
    return JSON.parse(localStorage.getItem("links"));
  }

  function saveLink(links) {
    const shortenedLink = { ...links };
    const savedLinks = getLinksFromStorage();
    if (savedLinks === null) {
      localStorage.setItem("links", JSON.stringify(new Array(shortenedLink)));
    } else {
      savedLinks.push(shortenedLink);
      localStorage.setItem("links", JSON.stringify(savedLinks));
    }
  }

  function updateBox(res) {
    if (res.error !== true) {
      const shortLinkField = res.box.querySelector(
        ".links-card__shortened-link"
      );
      const cardBtn = res.box.querySelector(".btn");
      shortLinkField.textContent = res.links.short;
      shortLinkField.href = res.links.short;
      shortLinkField.target = "_blank";
      cardBtn.textContent = "Copy!";
      cardBtn.addEventListener("click", async function () {
        try {
          await navigator.clipboard.writeText(res.links.short);
          console.log("Link copied to clipboard");
        } catch (err) {
          console.log(err);
        }
      });
      return { ...res.links };
    }
  }

  async function getShortenedLink(data) {
    try {
      const request = await fetch(
        `https://api.shrtco.de/v2/shorten?url=${data.link}`
      );
      const response = await request.json();
      const links = {
        short: response.result.full_short_link,
        original: response.result.original_link,
      };
      return { error: false, box: data.box, links: { ...links } };
    } catch (err) {
      console.log(err);
      return true, data.box;
    }
  }

  function inputValidation(input) {
    const value = input.value;
    if (value == "" || isValidURL(value) === false) {
      return false;
    }
    return value;
  }

  function drawBox(link) {
    const box = document.createElement("div");
    let displayLink = link;
    box.classList.add("links-card", "resize-height");
    if (link.length > 50) displayLink = link.slice(0, 51) + "...";
    box.innerHTML = `
    <h2 class="links-card__link">${displayLink}</h2>
    <a class="links-card__shortened-link"></a>
    <a id="links-btn" class="btn links-btn"><span class="lnr lnr-sync spin"></span></a>
    `;
    linksContainer.prepend(box);
    return { link: link, box: box };
  }

  function isValidURL(url) {
    try {
      new URL(url);
    } catch (err) {
      console.log(err);
      return false;
    }
    return true;
  }
});

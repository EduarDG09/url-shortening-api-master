document.addEventListener("DOMContentLoaded", function () {
  const linkInput = document.getElementById("short-input");
  const linksContainer = document.getElementById("links-container");
  const linkBtn = document.getElementById("short-btn");
  const shortenLink = mainService();

  loadRecentLinks();
  linkBtn.addEventListener("click", shortenLink);

  function loadRecentLinks() {
    const savedLinks = getLinksFromStorage();
    if (savedLinks !== null) {
      const linksContainerTitle = document.createElement("h3");
      linksContainerTitle.classList.add("links-container__title");
      linksContainerTitle.textContent = "your recent links";
      linksContainer.parentNode.insertBefore(
        linksContainerTitle,
        linksContainer
      );
      savedLinks.forEach((savedLink) => {
        updateBox(drawBox({ new: false, links: savedLink }));
      });
    }
  }

  function mainService() {
    let processing = 0;
    let queue = [];
    return async (link) => {
      if (processing < 5) {
        const link = inputValidation(linkInput);
        if (link !== false) {
          if (queue.includes(link))
            return console.log("El link introducido ya está siendo procesado.");
          else queue.push(link);
          processing++;
          linkInput.value = "";
          saveLink(
            updateBox(await getShortenedLink(drawBox(verifyExistingLink(link))))
          );
          if (queue.indexOf(link) !== -1) queue.splice(queue.indexOf(link), 1);
          processing--;
          return console.log("Link procesado correctamente!");
        }
      } else {
        console.log("No se pueden procesar mas de 5 links a la vez!");
        return;
      }
    };
  }

  function verifyExistingLink(link) {
    try {
      const match = getLinksFromStorage().find((savedLink) =>
        Object.values(savedLink).includes(link)
      );
      if (match !== undefined) return { new: false, links: match };
      else throw Error;
    } catch {
      return { new: true, link: link };
    }
  }

  function getLinksFromStorage() {
    return JSON.parse(localStorage.getItem("links"));
  }

  function saveLink(info) {
    if (info.new === false || info.error === true) return;
    else {
      const shortenedLink = { ...info.links };
      const savedLinks = getLinksFromStorage();
      if (savedLinks === null) {
        localStorage.setItem("links", JSON.stringify(new Array(shortenedLink)));
      } else {
        savedLinks.push(shortenedLink);
        if (savedLinks.length > 5) savedLinks.shift();
        localStorage.setItem("links", JSON.stringify(savedLinks));
      }
    }
  }

  function updateBox(info) {
    const shortLinkField = info.box.querySelector(
      ".links-card__shortened-link"
    );
    const cardBtn = info.box.querySelector(".btn");
    if (info.error) {
      shortLinkField.textContent = "Error while processing the link.";
      shortLinkField.classList.add("error");
      cardBtn.textContent = "Error";
      cardBtn.classList.add("error");
      return info;
    }
    shortLinkField.textContent = info.links.short;
    shortLinkField.href = info.links.short;
    shortLinkField.target = "_blank";
    cardBtn.textContent = "Copy";
    cardBtn.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(info.links.short);
        this.classList.add("btn--dark");
        this.textContent = "Copied!";
        setTimeout(() => {
          this.classList.remove("btn--dark"), (this.textContent = "Copy");
        }, 3000);
      } catch (err) {
        console.log(err);
      }
    });
    return info;
  }

  async function getShortenedLink(info) {
    if (info.new === false) return info;
    else {
      try {
        const request = await fetch(
          `https://api.shrtco.de/v2/shorten?url=${info.link}`
        );
        const response = await request.json();
        const links = {
          original: response.result.original_link,
          short: response.result.full_short_link,
        };
        return { new: info.new, links: links, box: info.box };
      } catch (err) {
        return { error: true, box: info.box };
      }
    }
  }

  function inputValidation(input) {
    const value = input.value;
    if (value == "" || isValidURL(value) === false) {
      return false;
    }
    return value;
  }

  function drawBox(info) {
    if (linksContainer.childElementCount > 4)
      undrawBox(linksContainer.lastElementChild);
    const box = document.createElement("div");
    let userLink = (displayLink = info.new ? info.link : info.links.original);
    box.classList.add("links-card", "resize-height");
    if (userLink.length > 50) displayLink = userLink.slice(0, 51) + "...";
    box.innerHTML = `
      <h2 class="links-card__link">${displayLink}</h2>
      <a class="links-card__shortened-link"></a>
      <a id="links-btn" class="btn links-btn"><span class="lnr lnr-sync spin"></span></a>
    `;
    linksContainer.prepend(box);
    box.addEventListener("animationend", function () {
      this.classList.remove("resize-height");
    });
    return { box: box, ...info };
  }

  function undrawBox(box) {
    box.style.animation = "resize-height 350ms ease-out reverse forwards";
    box.addEventListener("animationend", function () {
      this.remove();
    });
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

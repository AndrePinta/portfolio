
document.addEventListener('DOMContentLoaded', () => {
  // HIDE THE HEADER UNTIL THE POINTER RETURNS TO THE TOP EDGE
  const header = document.querySelector('header');
  const projectHero = document.querySelector('.project-page .project-hero');
  const projectHeroContent = projectHero?.querySelector('.wrap');

  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('is-hidden', window.scrollY > 80);
    }, { passive: true });

    document.addEventListener('pointermove', event => {
      if (event.clientY <= 80) {
        header.classList.remove('is-hidden');
      }
    });
  }

  // ABOUT TEXT SCANNER — each word changes face on hover while transient,
  // TouchDesigner-inspired tracks connect random points in the text.
  const aboutBody = document.querySelector('.about-body');

  if (aboutBody) {
    const textNodes = [];
    const walker = document.createTreeWalker(aboutBody, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim()) textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      const fragment = document.createDocumentFragment();
      textNode.nodeValue.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
          return;
        }

        const word = document.createElement('span');
        word.className = 'about-word';
        word.dataset.key = part.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
        word.textContent = part;
        fragment.appendChild(word);
      });
      textNode.parentNode.replaceChild(fragment, textNode);
    });

    const words = [...aboutBody.querySelectorAll('.about-word')];
    const semanticPairs = [
      ['andrea', 'pintauro'], ['freelance', 'designer'], ['graphic', 'designer'],
      ['visual', 'identity'], ['editorial', 'design'], ['type', 'design'],
      ['images', 'layout'], ['focus', 'typography'], ['text', 'formatting'],
      ['image', 'production'], ['visual', 'coherence'], ['overall', 'coherence'],
      ['developing', 'solutions'], ['print', 'digital'], ['digital', 'media']
    ].flatMap(([first, second]) => {
      const starts = words.filter(word => word.dataset.key === first);
      const ends = words.filter(word => word.dataset.key === second);
      return starts.flatMap(start => ends.filter(end => end !== start).map(end => [start, end]));
    });

    const smoothlyUpdateWords = update => {
      const before = new Map(words.map(word => [word, word.getBoundingClientRect()]));
      update();

      words.forEach(word => {
        const previous = before.get(word);
        const next = word.getBoundingClientRect();
        const deltaX = previous.left - next.left;
        const deltaY = previous.top - next.top;

        if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;
        word._aboutLayoutAnimation?.cancel();
        word._aboutLayoutAnimation = word.animate([
          { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
          { transform: 'translate3d(0, 0, 0)' }
        ], {
          duration: 520,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both'
        });
      });
    };
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const connections = document.createElementNS(svgNamespace, 'svg');
    connections.classList.add('about-connections');
    connections.setAttribute('aria-hidden', 'true');
    aboutBody.prepend(connections);

    const randomConnections = anchor => {
      const pairs = [];
      const usedPairs = new Set();
      const highlighted = new Set();
      const total = Math.min(6, Math.floor(words.length / 2));
      const addPair = (start, end) => {
        const startIndex = words.indexOf(start);
        const endIndex = words.indexOf(end);
        const key = [startIndex, endIndex].sort((a, b) => a - b).join('-');
        const nextHighlighted = new Set([...highlighted, startIndex, endIndex]);
        let runLength = 0;

        for (let index = 0; index < words.length; index += 1) {
          runLength = nextHighlighted.has(index) ? runLength + 1 : 0;
          if (runLength > 2) return false;
        }

        if (start === end || usedPairs.has(key)) return false;
        usedPairs.add(key);
        highlighted.add(startIndex);
        highlighted.add(endIndex);
        pairs.push([start, end]);
        return true;
      };

      const anchoredPairs = semanticPairs.filter(([start, end]) => start === anchor || end === anchor);
      if (anchoredPairs.length) {
        const [start, end] = anchoredPairs[Math.floor(Math.random() * anchoredPairs.length)];
        addPair(start, end);
      } else {
        const anchorIndex = words.indexOf(anchor);
        const neighbourIndices = [anchorIndex - 1, anchorIndex + 1]
          .filter(index => index >= 0 && index < words.length);
        const neighbourIndex = neighbourIndices[Math.floor(Math.random() * neighbourIndices.length)];
        addPair(anchor, words[neighbourIndex]);
      }

      // Keep a few tracks semantic, then add long-distance random tracks
      // so the network remains lively without losing the editorial logic.
      while (pairs.length < total - 3) {
        const [start, end] = semanticPairs[Math.floor(Math.random() * semanticPairs.length)];
        addPair(start, end);
      }

      while (pairs.length < total) {
        const start = words[Math.floor(Math.random() * words.length)];
        const end = words[Math.floor(Math.random() * words.length)];
        addPair(start, end);
      }

      return pairs;
    };

    const clearConnections = () => {
      connections.replaceChildren();
      smoothlyUpdateWords(() => {
        words.forEach(word => word.classList.remove('is-connected', 'is-active'));
      });
    };

    const drawConnections = anchor => {
      if (!anchor) {
        clearConnections();
        return;
      }

      const pairs = randomConnections(anchor);
      connections.replaceChildren();
      smoothlyUpdateWords(() => {
        words.forEach(word => word.classList.remove('is-connected', 'is-active'));
        anchor.classList.add('is-active');
        pairs.forEach(([startWord, endWord]) => {
          startWord.classList.add('is-connected');
          endWord.classList.add('is-connected');
        });
      });

      const bodyBounds = aboutBody.getBoundingClientRect();
      connections.setAttribute('viewBox', `0 0 ${bodyBounds.width} ${bodyBounds.height}`);

      pairs.forEach(([startWord, endWord], index) => {
        const start = startWord.getBoundingClientRect();
        const end = endWord.getBoundingClientRect();
        const x1 = start.left - bodyBounds.left + start.width * (0.25 + Math.random() * 0.5);
        const y1 = start.top - bodyBounds.top + start.height * (0.35 + Math.random() * 0.3);
        const x2 = end.left - bodyBounds.left + end.width * (0.25 + Math.random() * 0.5);
        const y2 = end.top - bodyBounds.top + end.height * (0.35 + Math.random() * 0.3);
        const line = document.createElementNS(svgNamespace, 'line');
        const length = Math.hypot(x2 - x1, y2 - y1);

        line.classList.add('about-connection');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.style.setProperty('--connection-length', length.toFixed(0));
        line.style.setProperty('--connection-delay', `${index * 35}ms`);
        connections.appendChild(line);
      });
    };

    let activeWord = null;
    let redrawTimeout;
    const requestRedraw = () => {
      window.clearTimeout(redrawTimeout);
      redrawTimeout = window.setTimeout(() => drawConnections(activeWord), 180);
    };

    aboutBody.addEventListener('pointerover', event => {
      const word = event.target.closest('.about-word');
      if (!word || word === activeWord) return;
      activeWord = word;
      drawConnections(activeWord);
    });

    aboutBody.addEventListener('pointermove', event => {
      if (event.target.closest('.about-word') || !activeWord) return;
      activeWord = null;
      clearConnections();
    });

    aboutBody.addEventListener('pointerleave', () => {
      activeWord = null;
      clearConnections();
    });

    const resizeObserver = new ResizeObserver(requestRedraw);
    resizeObserver.observe(aboutBody);
    window.addEventListener('resize', requestRedraw, { passive: true });
    document.fonts?.ready.then(requestRedraw);
  }

  // Fade the project introduction as it moves out of view.
  if (projectHero && projectHeroContent) {
    const updateProjectHero = () => {
      const fadeDistance = Math.max(projectHero.offsetHeight * 0.9, 360);
      const progress = Math.min(1, window.scrollY / fadeDistance);
      const opacity = 1 - progress;
      projectHeroContent.style.opacity = opacity.toFixed(3);
      projectHeroContent.style.transform = `translate3d(0, ${-progress * 80}px, 0)`;
    };

    window.addEventListener('scroll', updateProjectHero, { passive: true });
    updateProjectHero();
  }

  const updateWindowedLayout = () => {
    const isDesktopWindowed = window.innerWidth > 768
      && document.body.classList.contains('project-1')
      && !document.fullscreenElement
      && (window.outerWidth < screen.availWidth - 80 || window.outerHeight < screen.availHeight - 80);
    document.body.classList.toggle('is-windowed', isDesktopWindowed);
  };

  updateWindowedLayout();
  window.addEventListener('resize', updateWindowedLayout);
  document.addEventListener('fullscreenchange', updateWindowedLayout);

  // Map the page scroll to the horizontal spread reel.
  const spreadReel = document.querySelector('body.project-1 .spread-reel');
  const spreadTrack = spreadReel?.querySelector('.spread-reel-track');

  if (spreadReel && spreadTrack) {
    const originalPanels = [...spreadTrack.children];
    const panelCount = originalPanels.length;
    originalPanels.forEach(panel => spreadTrack.appendChild(panel.cloneNode(true)));
    originalPanels.forEach(panel => spreadTrack.appendChild(panel.cloneNode(true)));

    let targetX = 0;
    let currentX = 0;
    let animationFrame;
    let lastPointerX = null;
    let pointerDownX = null;
    let isClickAnimating = false;

    const getCycleWidth = () => {
      const panelWidth = spreadTrack.children[0]?.getBoundingClientRect().width || 0;
      const gap = parseFloat(window.getComputedStyle(spreadTrack).columnGap) || 0;
      return (panelWidth + gap) * panelCount;
    };

    const keepInMiddleSequence = () => {
      const cycleWidth = getCycleWidth();
      if (!cycleWidth) return;

      while (targetX >= 0) {
        targetX -= cycleWidth;
        currentX -= cycleWidth;
      }
      while (targetX <= -cycleWidth * 2) {
        targetX += cycleWidth;
        currentX += cycleWidth;
      }
    };

    const updateFromTrackpad = event => {
      const horizontalDelta = event.shiftKey ? event.deltaY : event.deltaX;
      if (Math.abs(horizontalDelta) <= Math.abs(event.deltaY) && !event.shiftKey) return;

      event.preventDefault();
      isClickAnimating = false;
      targetX -= horizontalDelta;
      keepInMiddleSequence();
    };

    const updateFromPointer = event => {
      if (lastPointerX === null) {
        lastPointerX = event.clientX;
        return;
      }

      targetX -= (event.clientX - lastPointerX) * 1.5;
      isClickAnimating = false;
      lastPointerX = event.clientX;
      keepInMiddleSequence();
    };

    const moveToAdjacentSpread = event => {
      if (pointerDownX !== null && Math.abs(event.clientX - pointerDownX) > 8) return;

      const panelWidth = spreadTrack.children[0]?.getBoundingClientRect().width || 0;
      if (!panelWidth) return;

      const direction = event.clientX >= spreadReel.clientWidth / 2 ? -1 : 1;
      targetX += direction * panelWidth;
      isClickAnimating = true;
      keepInMiddleSequence();
    };

    const animateTrack = () => {
      const animationSpeed = isClickAnimating ? 0.055 : 0.09;
      currentX += (targetX - currentX) * animationSpeed;
      if (Math.abs(targetX - currentX) < 0.1) {
        currentX = targetX;
        isClickAnimating = false;
      }
      spreadTrack.style.transform = `translate3d(${currentX}px, 0, 0)`;
      animationFrame = window.requestAnimationFrame(animateTrack);
    };

    spreadReel.addEventListener('wheel', updateFromTrackpad, { passive: false });
    spreadReel.addEventListener('pointermove', updateFromPointer, { passive: true });
    spreadReel.addEventListener('pointerdown', event => {
      pointerDownX = event.clientX;
    });
    spreadReel.addEventListener('click', moveToAdjacentSpread);
    spreadReel.addEventListener('pointerleave', () => {
      lastPointerX = null;
      pointerDownX = null;
    });
    spreadReel.addEventListener('pointerup', () => {
      window.setTimeout(() => {
        pointerDownX = null;
      }, 0);
    });
    window.addEventListener('resize', () => {
      keepInMiddleSequence();
    });
    window.requestAnimationFrame(() => {
      const cycleWidth = getCycleWidth();
      targetX = -cycleWidth;
      currentX = targetX;
      spreadTrack.style.transform = `translate3d(${currentX}px, 0, 0)`;
    });
    animationFrame = window.requestAnimationFrame(animateTrack);

    window.addEventListener('pagehide', () => window.cancelAnimationFrame(animationFrame), { once: true });
  }

  // LIVE DATE AND TIME FOR ROME
  const romeDate = document.getElementById('romeDate');
  const romeTime = document.getElementById('romeTime');
  const romeGmt = document.getElementById('romeGmt');
  const feelsLike = document.getElementById('feelsLike');
  const romeDateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const romeTimeFormatter = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const updateRomeWeather = async () => {
    if (!feelsLike) return;

    try {
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=41.9028&longitude=12.4964&current=apparent_temperature&timezone=Europe%2FRome');
      if (!response.ok) throw new Error('Weather request failed');
      const weather = await response.json();
      feelsLike.textContent = `${Math.round(weather.current.apparent_temperature)}°C (percepiti deppiù)`;
    } catch (error) {
      feelsLike.textContent = '--°C (percepiti deppiù)';
    }
  };

  const updateRomeClock = () => {
    const now = new Date();
    if (romeDate) romeDate.textContent = romeDateFormatter.format(now);
    if (romeTime) romeTime.textContent = romeTimeFormatter.format(now);
    if (romeGmt) romeGmt.textContent = 'GMT';
  };

  updateRomeClock();
  updateRomeWeather();
  window.setInterval(updateRomeClock, 1000);

});

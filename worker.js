const FALLBACK = 'https://smashedllama.github.io/bladeflow/icon.png';
const GALLERY = 'https://smashedllama.github.io/bladeflow/gallery.html';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const d = url.searchParams.get('d');

    let img = FALLBACK;
    let title = 'BladeFlow Gallery';
    let desc = 'Knife listing gallery powered by BladeFlow for r/Knife_Swap';

    if (d) {
      try {
        const data = JSON.parse(atob(d));
        if (data.timestamp && data.timestamp.length) {
          img = data.timestamp[0];
        } else if (data.knives && data.knives[0] && data.knives[0].imgs && data.knives[0].imgs[0]) {
          img = data.knives[0].imgs[0];
        }
        if (data.user) title = 'u/' + data.user + ' \u2014 Knife Listing';
        if (data.knives && data.knives.length) {
          var names = data.knives.slice(0, 3).map(function(k) { return k.name; }).join(', ');
          desc = names + (data.knives.length > 3 ? ' +' + (data.knives.length - 3) + ' more' : '');
        }
      } catch (e) {
        img = FALLBACK;
      }
    }

    var galleryUrl = GALLERY + url.search;
    var html;
    try {
      var res = await fetch(galleryUrl);
      if (!res.ok) throw new Error('bad response');
      html = await res.text();
    } catch (e) {
      return Response.redirect(galleryUrl, 302);
    }

    // Strip existing og: and twitter: meta tags so ours win
    html = html.replace(/<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/gi, '');

    var og = '\n'
      + '  <meta property="og:type" content="website">\n'
      + '  <meta property="og:title" content="' + title.replace(/"/g, '&quot;') + '">\n'
      + '  <meta property="og:description" content="' + desc.replace(/"/g, '&quot;') + '">\n'
      + '  <meta property="og:image" content="' + img + '">\n'
      + '  <meta property="og:image:width" content="1200">\n'
      + '  <meta name="twitter:card" content="summary_large_image">\n'
      + '  <meta name="twitter:image" content="' + img + '">\n';

    html = html.replace('</head>', og + '</head>');

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  },
};

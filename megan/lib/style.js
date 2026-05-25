// Megan-Prime Text Styler - Unicode Decorations
// Use these to make bot responses look better

const STYLES = {
    // Bold fonts
    bold: (text) => text.replace(/[A-Za-z0-9]/g, c => {
        const boldMap = {
            'A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚','H':'𝗛','I':'𝗜','J':'𝗝',
            'K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡','O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧',
            'U':'𝗨','V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭',
            'a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴','h':'𝗵','i':'𝗶','j':'𝗷',
            'k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻','o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁',
            'u':'𝘂','v':'𝘃','w':'𝘄','x':'𝘅','y':'𝘆','z':'𝘇',
            '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵'
        };
        return boldMap[c] || c;
    }),

    // Italic fonts
    italic: (text) => text.replace(/[A-Za-z]/g, c => {
        const italicMap = {
            'A':'𝘈','B':'𝘉','C':'𝘊','D':'𝘋','E':'𝘌','F':'𝘍','G':'𝘎','H':'𝘏','I':'𝘐','J':'𝘑',
            'K':'𝘒','L':'𝘓','M':'𝘔','N':'𝘕','O':'𝘖','P':'𝘗','Q':'𝘘','R':'𝘙','S':'𝘚','T':'𝘛',
            'U':'𝘜','V':'𝘝','W':'𝘞','X':'𝘟','Y':'𝘠','Z':'𝘡',
            'a':'𝘢','b':'𝘣','c':'𝘤','d':'𝘥','e':'𝘦','f':'𝘧','g':'𝘨','h':'𝘩','i':'𝘪','j':'𝘫',
            'k':'𝘬','l':'𝘭','m':'𝘮','n':'𝘯','o':'𝘰','p':'𝘱','q':'𝘲','r':'𝘳','s':'𝘴','t':'𝘵',
            'u':'𝘶','v':'𝘷','w':'𝘸','x':'𝘹','y':'𝘺','z':'𝘻'
        };
        return italicMap[c] || c;
    }),

    // Bold Italic
    boldItalic: (text) => text.replace(/[A-Za-z]/g, c => {
        const biMap = {
            'A':'𝙰','B':'𝙱','C':'𝙲','D':'𝙳','E':'𝙴','F':'𝙵','G':'𝙶','H':'𝙷','I':'𝙸','J':'𝙹',
            'K':'𝙺','L':'𝙻','M':'𝙼','N':'𝙽','O':'𝙾','P':'𝙿','Q':'𝚀','R':'𝚁','S':'𝚂','T':'𝚃',
            'U':'𝚄','V':'𝚅','W':'𝚆','X':'𝚇','Y':'𝚈','Z':'𝚉',
            'a':'𝚊','b':'𝚋','c':'𝚌','d':'𝚍','e':'𝚎','f':'𝚏','g':'𝚐','h':'𝚑','i':'𝚒','j':'𝚓',
            'k':'𝚔','l':'𝚕','m':'𝚖','n':'𝚗','o':'𝚘','p':'𝚙','q':'𝚚','r':'𝚛','s':'𝚜','t':'𝚝',
            'u':'𝚞','v':'𝚟','w':'𝚠','x':'𝚡','y':'𝚢','z':'𝚣'
        };
        return biMap[c] || c;
    }),

    // Script/Cursive
    script: (text) => text.replace(/[A-Za-z]/g, c => {
        const scriptMap = {
            'A':'𝒜','B':'𝐵','C':'𝒞','D':'𝒟','E':'𝐸','F':'𝐹','G':'𝒢','H':'𝐻','I':'𝐼','J':'𝒥',
            'K':'𝒦','L':'𝐿','M':'𝑀','N':'𝒩','O':'𝒪','P':'𝒫','Q':'𝒬','R':'𝑅','S':'𝒮','T':'𝒯',
            'U':'𝒰','V':'𝒱','W':'𝒲','X':'𝒳','Y':'𝒴','Z':'𝒵',
            'a':'𝒶','b':'𝒷','c':'𝒸','d':'𝒹','e':'𝑒','f':'𝒻','g':'𝑔','h':'𝒽','i':'𝒾','j':'𝒿',
            'k':'𝓀','l':'𝓁','m':'𝓂','n':'𝓃','o':'𝑜','p':'𝓅','q':'𝓆','r':'𝓇','s':'𝓈','t':'𝓉',
            'u':'𝓊','v':'𝓋','w':'𝓌','x':'𝓍','y':'𝓎','z':'𝓏'
        };
        return scriptMap[c] || c;
    })
};

// Borders and separators
const BORDERS = {
    double: '═',
    single: '─',
    thick: '━',
    dotted: '┈',
    dashed: '╌',
};

const CORNERS = {
    rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯' },
    sharp: { tl: '┌', tr: '┐', bl: '└', br: '┘' },
    double: { tl: '╔', tr: '╗', bl: '╚', br: '╝' },
};

// Create a header box
function header(title, subtitle = '', style = 'double') {
    const len = Math.max(title.length, subtitle.length) + 4;
    const c = CORNERS[style] || CORNERS.double;
    const b = BORDERS[style] || BORDERS.double;
    let box = `${c.tl}${b.repeat(len)}${c.tr}\n`;
    box += `┃  ${title.padEnd(len - 2)}┃\n`;
    if (subtitle) box += `┃  ${subtitle.padEnd(len - 2)}┃\n`;
    box += `${c.bl}${b.repeat(len)}${c.br}`;
    return box;
}

// Section divider
function divider(text = '') {
    const b = BORDERS.double;
    if (text) return `\n${b.repeat(5)} ${text} ${b.repeat(5)}\n`;
    return b.repeat(20);
}

// Arrow indicators
const ARROWS = {
    right: '▸',
    left: '◂',
    down: '▾',
    up: '▴',
    bullet: '•',
    diamond: '◆',
    star: '★',
    check: '✅',
    cross: '❌',
    arrow: '➜',
};

// Quick style helper
function bold(text) { return STYLES.bold(String(text)); }
function italic(text) { return STYLES.italic(String(text)); }
function script(text) { return STYLES.script(String(text)); }
function boldItalic(text) { return STYLES.boldItalic(String(text)); }

module.exports = { STYLES, BORDERS, CORNERS, ARROWS, header, divider, bold, italic, script, boldItalic };

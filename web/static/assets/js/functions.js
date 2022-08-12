const membersCache = []

const GetMemberByUid = async (id) => {
    if (membersCache.filter(m => m.ttl > Date.now()).map(m => m.id).includes(id)) return membersCache.filter(m => m.ttl > Date.now() && m.id == id)[0]
    const data = await fetch("https://ucp.paradise-rpg.pl/api/profile/" + id).then(res => res.json())
    if (!data || data.length == 0) return { login: "Brak danych" };
    let user = {
        id: data.account.id,
        login: data.account.login,
        rank: data.account.rank,
        skin: data.account.skin,
        ttl: Date.now() + (5 * 60 * 1000)
    }
    membersCache.push(user)
    return user
}

const NumberWithSpaces = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const showAlert = (where, type, message) => {
    let el = document.getElementById(where)
    if (!el) return;
    el.innerHTML = `<div class="row"><div class="alert alert-${type}" role="alert">${message}</div></div>`
    setTimeout(() => {
        el.innerHTML = ''
    }, 10 * 1000)
}

const rankMapping = {
    "-1": "Zasłużony",
    "1": "Support",
    "2": "Moderator",
    "3": "Administrator",
    "2.5": "Global Moderator",
    "4": "Zarząd / RCON"
}

const rankBackgroundMapping = {
    "Zasłużony": "rgb(65, 118, 214)",
    "Support": "rgb(87, 175, 204)",
    "Moderator": "rgb(87, 204, 162)",
    "Global Moderator": "rgb(243, 156, 18)",
    "Administrator": "rgb(224, 82, 82)",
    "Zarząd / RCON": "rgb(181, 67, 67)",
}

const GetBadge = (rank) => {
    return rankMapping[`${rank}`] || "Brak danych"
}
const GetBadgeColor = (name) => {
    return rankBackgroundMapping[name] || "rgb(0, 0, 0)"
}
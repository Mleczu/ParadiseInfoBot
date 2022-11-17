const types = ["channels", "roles"]
fetch("/api/discordList").then(res=> {
    res.json().then(resj => {
        if (!resj) return
        for (const type of types) {
            for (const s of document.querySelectorAll('select[data-discordfill=' + type + ']')) {
                if (!s.hasAttribute("data-discordnonempty")) {
                    const og = document.createElement('optgroup')
                    og.label = "Inne"
                    const o = document.createElement('option')
                    o.value = ""
                    o.innerHTML = "Brak przypisania"
                    o.selected = true
                    og.appendChild(o)
                    s.appendChild(og)    
                }
                const og2 = document.createElement('optgroup')
                og2.label = "Dostępne opcje"
                for (const d of resj.data[type]) {
                    const o = document.createElement('option')
                    o.value = d.id
                    o.innerHTML = " ⨠ " + d.name
                    og2.appendChild(o)
                }
                s.appendChild(og2)
            }
        }
    })
})
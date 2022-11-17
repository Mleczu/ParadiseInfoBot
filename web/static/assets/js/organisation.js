const groupId = document.getElementById("groupId").value

const colorRegex = new RegExp(/\[\[(\d*)\,(\d*)\,(\d*)\]\]/)

const LoadData = async () => {
    const data = await fetch("https://ucp.paradise-rpg.pl/api/group/" + groupId).then(res=>res.json())
    if (!data) return
    document.getElementById("groupLogo").src = data.group.logo
    document.getElementById("groupName").textContent = data.group.name
    const colors = data.group.color.match(colorRegex)
    document.getElementById("groupName").style = "color: rgb(" + colors[1] + ", " + colors[2] + ", " + colors[3] + ")"
    const dataChannels = await fetch("/api/channels").then(res=>res.json())
    if (!dataChannels) return;
    for (const key in dataChannels) {
        document.getElementById(key).value = dataChannels[key]
    }
    const dataPings = await fetch("/api/pings").then(res=>res.json())
    if (!dataPings) return;
    for (const key in dataPings) {
        document.getElementById(key).checked = dataPings[key]
    }
}
LoadData()

const balanceDateInput = document.getElementById('balanceDate')
const balanceValues = {
    in: document.getElementById("balanceValuesIn"),
    out: document.getElementById("balanceValuesOut"),
    summary: document.getElementById("balanceValuesSummary")
}
balanceDateInput.onchange = async () => {
    const data = await fetch("/api/balance/" + balanceDateInput.value).then(res => res.json())
    if (!data.in || !data.out) {
        balanceValues.in.textContent = "Brak danych"
        balanceValues.out.textContent = "Brak danych"
        balanceValues.summary.textContent = "Brak danych"
        return
    }
    balanceValues.in.textContent = data.in + "$";
    balanceValues.out.textContent = data.out + "$";
    balanceValues.summary.textContent = (data.in - data.out) + "$";
}

const channelSubmit = document.getElementById('settingsSubmit')
channelSubmit.onclick = async (e) => {
    e.preventDefault();
    channelSubmit.disabled = true;
    const settings = document.querySelectorAll(`[id^="channel"]`);
    const values = []
    for (const i of settings) {
        if ((i.value != null && !isNaN(i.value))) {
            values.push({ name: i.id, value: i.value })
        }
    }
    if (values.length == 0) {
        channelSubmit.disabled = false;
        showAlert("settingsSubmitAlert", "warning", "<strong>Nie udało się zapisać ustawień!</strong> Brak zmian")
        return
    }
    console.log(values)
    const data = await fetch("/api/channels", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: values })
    }).then(res=>res.json())
    channelSubmit.disabled = false;
    if (!data) {
        showAlert("settingsSubmitAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Nieoczekiwany błąd.")
        return
    }
    if (data.success) {
        showAlert("settingsSubmitAlert", "success", "<strong>Pomyślnie zaktualizowano!</strong>")
        return
    } else {
        showAlert("settingsSubmitAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Wystąpił błąd - " + data.message)
        return
    }
}

const pingSubmit = document.getElementById('pingSubmit')
pingSubmit.onclick = async (e) => {
    e.preventDefault();
    pingSubmit.disabled = true;
    const settings = document.querySelectorAll(`[id^="switchPing"]`);
    const values = []
    for (const i of settings) {
        values.push({ name: i.id, value: i.checked })
    }
    const data = await fetch("/api/pings", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: values })
    }).then(res=>res.json())
    pingSubmit.disabled = false;
    if (!data) {
        showAlert("pingSubmitAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Nieoczekiwany błąd.")
        return
    }
    if (data.success) {
        showAlert("pingSubmitAlert", "success", "<strong>Pomyślnie zaktualizowano!</strong>")
        return
    } else {
        showAlert("pingSubmitAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Wystąpił błąd - " + data.message)
        return
    }
}
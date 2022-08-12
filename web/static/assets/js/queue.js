const LoadData = async () => {
    const data = await fetch("/api/queue/data").then(res=>res.json())
    if (!data) return
    for (const k in data) {
        const d = data[k]
        document.getElementById('queue_' + k + '_time').value = d.time
        document.getElementById('queue_' + k + '_status').checked = d.status
        console.log(d)
    }
}
LoadData()

const ToggleQueue = async (where, check) => {
    const data = await fetch("/api/queue/status", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { where, status: check.checked } })
    }).then(res=>res.json())
    if (!data) {
        showAlert(where + "QueueAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Nieoczekiwany błąd.")
        return
    }
    if (data.success) {
        showAlert(where + "QueueAlert", "success", "<strong>Pomyślnie zaktualizowano!</strong>")
        return
    } else {
        showAlert(where + "QueueAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Wystąpił błąd - " + data.message)
        return
    }
}

const SaveSettings = async (where) => {
    let c = null
    const ic = document.getElementById("queue_" + where + "_channel").value
    if ((ic.value != null && ic.value.length > 10 && !isNaN(ic.value)) || (ic.value == "")) c = ic
    const data = await fetch("/api/queue/edit", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { where, channel: c, time: document.getElementById("queue_" + where + "_time").value } })
    }).then(res=>res.json())
    if (!data) {
        showAlert(where + "QueueAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Nieoczekiwany błąd.")
        return
    }
    if (data.success) {
        showAlert(where + "QueueAlert", "success", "<strong>Pomyślnie zaktualizowano!</strong>")
        return
    } else {
        showAlert(where + "QueueAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Wystąpił błąd - " + data.message)
        return
    }
}
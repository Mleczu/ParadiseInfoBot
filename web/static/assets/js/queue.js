const LoadData = async () => {
    const data = await fetch("/api/queue/data").then(res=>res.json())
    if (!data) return
    for (const k in data) {
        const d = data[k]
        document.getElementById('queue_' + k + '_time').value = d.time
        document.getElementById('queue_' + k + '_status').checked = d.status
        let tableData = ''
        for (const td of d.table) {
            const user = ((td.user) ? await GetMemberByUid(td.user) : {login: "---"})
            tableData += "<tr><th>" + moment(td.date).format('DD-MM-YYYY') + "</th><th>" + moment(td.date).format('HH:mm') + "</th><td>" + user.login + "</td><td><button class='btn btn-sm btn-" + ((td.user) ? "danger" : "secondary") + "'" + ((td.user) ? "" : " disabled") + " onclick='DeleteAssignment(`" + k + "`, `" + moment(td.date).format('YYYY-MM-DD HH:mm') + "`)'>Zwolnij</button></td></tr>"
        }
        document.getElementById('queue_' + k + "_table").innerHTML = tableData
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
    let c = document.getElementById("queue_" + where + "_channel").value
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

const DeleteAssignment = async (where, date) => {
    await fetch("/api/queue/delete", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { where, date } })
    })
    window.location.reload()
}
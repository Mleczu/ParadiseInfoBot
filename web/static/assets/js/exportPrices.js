const LoadData = async () => {
    const dataPrices = await fetch("/api/exportPrices").then(res=>res.json())
    if (!dataPrices) return;
    document.getElementById("dataTable_resultCount").textContent = dataPrices.length
    document.getElementById("dataTableBody").innerHTML = ""
    for (const v of dataPrices) {
        document.getElementById("dataTableBody").innerHTML += "<tr><td>" + v.model + "</td><td>" + NumberWithSpaces(v.price) + "$</td><td><button onclick='RemoveVehicle(this)' value='" + v.model + "' class='btn btn-sm btn-primary'>Usuń</button></tr>"
    }
    const dataWarehouse = await fetch("/api/warehouse").then(res=>res.json())
    if (!dataPrices) return;
    document.getElementById("warehouseTable_resultCount").textContent = dataWarehouse.length
    document.getElementById("warehouseTableBody").innerHTML = ""
    for (const v of dataWarehouse) {
        document.getElementById("warehouseTableBody").innerHTML += "<tr><td>" + v.id + "</td><td>" + v.vehicle + "</td><td>Ładowanie...</td><td><button onclick='RemoveWarehouse(this)' value='" + v.id + "' class='btn btn-sm btn-primary'>Usuń</button></tr>"
    }
    let dataWarehouseUpdated = ""
    for (const v of dataWarehouse) {
        const u = await GetMemberByUid(v.uid)
        dataWarehouseUpdated += "<tr><td>" + v.id + "</td><td>" + v.vehicle + "</td><td>" + u.login + "</td><td><button onclick='RemoveWarehouse(this)' value='" + v.id + "' class='btn btn-sm btn-primary'>Usuń</button></tr>"
    }
    document.getElementById("warehouseTableBody").innerHTML = dataWarehouseUpdated
}
LoadData()

const addSubmit = document.getElementById('submitVehicle')
addSubmit.onclick = async (e) => {
    e.preventDefault();
    addSubmit.disabled = true;
    const values = { model: document.getElementById("editorModel").value, price: document.getElementById("editorPrice").value }
    const data = await fetch("/api/exportPrices", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: values })
    }).then(res=>res.json())
    addSubmit.disabled = false;
    if (!data) {
        showAlert("submitVehicleAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Nieoczekiwany błąd.")
        return
    }
    if (data.success) {
        showAlert("submitVehicleAlert", "success", "<strong>Pomyślnie zaktualizowano!</strong>")
        LoadData()
        return
    } else {
        showAlert("submitVehicleAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Wystąpił błąd - " + data.message)
        return
    }
}

const loadDefault = document.getElementById('loadDefaultVehicles')
loadDefault.onclick = async (e) => {
    e.preventDefault();
    loadDefault.disabled = true;
    const data = await fetch("/api/exportPrices", {
        method: "PATCH",
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(res=>res.json())
    loadDefault.disabled = false;
    if (!data) {
        showAlert("submitVehicleAlert", "danger", "<strong>Nie udało się wczytać ustawień!</strong> Nieoczekiwany błąd.")
        return
    }
    if (data.success) {
        showAlert("submitVehicleAlert", "success", "<strong>Pomyślnie wczytano!</strong>")
        LoadData()
        return
    } else {
        showAlert("submitVehicleAlert", "danger", "<strong>Nie udało się wczytać ustawień!</strong> Wystąpił błąd - " + data.message)
        return
    }
}

const RemoveVehicle = async (e) => {
    e.disabled = true;
    const values = { model: e.value }
    const data = await fetch("/api/exportPrices", {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: values })
    }).then(res=>res.json())
    e.disabled = false;
    if (!data) {
        showAlert("removeVehicleAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Nieoczekiwany błąd.")
        return
    }
    if (data.success) {
        showAlert("removeVehicleAlert", "success", "<strong>Pomyślnie zaktualizowano!</strong>")
        LoadData()
        return
    } else {
        showAlert("removeVehicleAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Wystąpił błąd - " + data.message)
        return
    }
}

const RemoveWarehouse = async (e) => {
    e.disabled = true;
    const values = { id: e.value }
    const data = await fetch("/api/warehouse", {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: values })
    }).then(res=>res.json())
    e.disabled = false;
    if (!data) {
        showAlert("removeVehicleAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Nieoczekiwany błąd.")
        return
    }
    if (data.success) {
        showAlert("removeVehicleAlert", "success", "<strong>Pomyślnie zaktualizowano!</strong>")
        LoadData()
        return
    } else {
        showAlert("removeVehicleAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Wystąpił błąd - " + data.message)
        return
    }
}
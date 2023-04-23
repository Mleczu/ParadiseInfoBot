const LoadData = async () => {
    const dataUcp = await fetch("https://ucp.paradise-rpg.pl/api/profile/" + document.getElementById("real_id").value).then(res=>res.json())
    if (!dataUcp) return;
    document.getElementById("ucp_skin").src = "https://ucp.paradise-rpg.pl/img/" + (dataUcp.account.skin || 0) + "_small.png"
    let badge = ""
    if (dataUcp.account.rank != 0) {
        badge = "<span class='badge rounded-pill' style='background-color: " + GetBadgeColor(GetBadge(dataUcp.account.rank)) + "'>" + GetBadge(dataUcp.account.rank) + "</span>&nbsp;"
    }
    document.getElementById("ucp_login").textContent = dataUcp.account.login
    document.getElementById("ucp_login2").innerHTML = badge + dataUcp.account.login
    const dataProfile = await fetch("/api/profile/" + document.getElementById("real_id").value).then(res=>res.json())
    if (!dataProfile) return
    for (const key in dataProfile) {
        if (!document.getElementById("profile_" + key)) continue;
        const all = document.querySelectorAll(`[id^="profile_${key}"]`);
        for (const a of all) {
            a.value = dataProfile[key]
        }
    }
    const dataHistory = await fetch("/api/dataHistory/" + document.getElementById("real_id").value).then(res=>res.json())
    if (!dataHistory) return
    let config = {
        type: 'line',
        data: {
            labels: dataHistory.map(d => {
                const t = new Date(d.date)
                const th = [((t.getHours() < 10) ? `0${t.getHours()}` : t.getHours()), ((t.getMinutes() < 10) ? `0${t.getMinutes()}` : t.getMinutes())].join(":")
                const ts = [((t.getDate() < 10) ? `0${t.getDate()}` : t.getDate()), ((t.getMonth() < 10) ? `0${t.getMonth()}` : t.getMonth()), t.getFullYear()].join(".")
                return th + " " + ts
            }),
            datasets: [
                {
                    label: "Pieniądze do wypłaty",
                    backgroundColor: 'rgb(54, 162, 235)',
                    borderColor: 'rgb(54, 162, 235)',
                    data: dataHistory.map(d => d.info.cash),
                    fill: false,
                }
        ]
        },
        options: {
            responsive: true,
            title:{
                display:false,
                text:'Pieniądze do wypłaty'
            },
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            }
        }
    };
    var ctx = document.getElementById("payoutChart").getContext("2d");
    window.myLine = new Chart(ctx, config);
}
LoadData()

const UpdateProfile = async (btn, action) => {
    const uid = document.getElementById("real_id").value
    const v = document.getElementById("edit_cash").value
    if (!v || !uid) return showAlert('manageAlert', 'danger', 'Nie udało się pobrać wartości.')
    btn.disabled = true;
    const data = await fetch("/api/profile/" + uid, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, value: v  })
    }).then(res=>res.json())
    btn.disabled = false;
    if (!data) {
        showAlert("manageAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Nieoczekiwany błąd.")
        return
    }
    if (data.success) {
        showAlert("manageAlert", "success", "<strong>Pomyślnie zaktualizowano!</strong>")
        LoadData()
        return
    } else {
        showAlert("manageAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Wystąpił błąd - " + data.message)
        return
    }
}

const DeleteProfile = async () => {
    const uid = document.getElementById("real_id").value
    if (!uid) return showAlert('deleteAccountAlert', 'danger', 'Nie udało się pobrać wartości.')
    const data = await fetch("/api/profile/" + uid, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(res=>res.json())
    btn.disabled = false;
    if (!data) {
        showAlert("deleteAccountAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Nieoczekiwany błąd.")
        return
    }
    if (data.success) {
        showAlert("deleteAccountAlert", "success", "<strong>Pomyślnie usunięto!</strong>")
        location.reload()
        return
    } else {
        showAlert("deleteAccountAlert", "danger", "<strong>Nie udało się zapisać ustawień!</strong> Wystąpił błąd - " + data.message)
        return
    }
}

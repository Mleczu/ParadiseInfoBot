const LoadData = async () => {
    const dataMembers = await fetch("/api/members").then(res=>res.json())
    if (!dataMembers) return;
    document.getElementById("dataTable_resultCount").textContent = dataMembers.length
    document.getElementById("dataTableBody").innerHTML = ""
    for (let i = 0; i < dataMembers.length; i++) {
        document.getElementById("dataTableBody").innerHTML += "<tr><td>Ładowanie...</td><td>Ładowanie...</td><td><a href='/dashboard/profile/" + dataMembers[i].uid + "' class='btn btn-small btn-primary'>Zarządzaj</a></tr>"
    }
    let data = ""
    for (const v of dataMembers) {
        const u = await GetMemberByUid(v.uid)
        data += "<tr><td>" + u.login + "</td><td>" + NumberWithSpaces(v.cash) + "$</td><td><a href='/dashboard/profile/" + v.uid + "' class='btn btn-small btn-primary'>Zarządzaj</a></tr>"
    }
    document.getElementById("dataTableBody").innerHTML = data
}
LoadData()
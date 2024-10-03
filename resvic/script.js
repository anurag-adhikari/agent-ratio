document.addEventListener("DOMContentLoaded", function () {
  const stat1Select = document.getElementById("stat1");
  const stat2Select = document.getElementById("stat2");
  const statsTableRoot = document.getElementById("stats_table_root");
  let dataTable;

  if (dataTable) {
    dataTable.clear().destroy();
  }

  function getQueryParams() {
    const params = new URLSearchParams(window.location.search);

    return {
      stat1: params.get("stat1") || "explorer",
      stat2: params.get("stat2") || "pioneer",
      sort: params.get("sort") || "ratio",
      order: params.get("order") || "ASC",
    };
  }

  function formatNumberWithCommas(x) {
    const parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function updateURL() {
    window.location.href = `stats.html?stat1=${stat1Select.value}&stat2=${stat2Select.value}&sort=ratio&order=ASC`;
  }

  function populateSelect(fields) {
    fields.forEach((field) => {
      const option1 = document.createElement("option");
      option1.value = field;
      option1.textContent = field;
      stat1Select.appendChild(option1);

      const option2 = document.createElement("option");
      option2.value = field;
      option2.textContent = field;
      stat2Select.appendChild(option2);
    });
  }

  function getTableData(data) {
    const stat1 = stat1Select.value;
    const stat2 = stat2Select.value;

    const tableData = data
      .map((row, index) => {
        let value1 = parseFloat(row[stat1]);
        let value2 = parseFloat(row[stat2]);

        if (isNaN(value1) || isNaN(value2)) {
          console.warn(
            `Invalid value for agent ${row.agent_name}: Field 1 - ${value1}, Field 2 - ${value2}`
          );
          statsTableRoot.innerHTML = `Invalid value for agent ${row.agent_name}: Field 1 - ${value1}, Field 2 - ${value2}`;
          return null;
        }

        const ratio = value2 !== 0 ? value1 / value2 : 0;
        const ratioPercent = value1 !== 0 ? (value2 / value1) * 100 : 0;
        const difference = Math.abs(value1 - value2);
        const factionLogo =
          row.faction.toLowerCase() === "res"
            ? "icons/Resistance_Logo.webp"
            : "icons/Enlightened_Logo.webp";
        const factionColor =
          row.faction.toLowerCase() === "res" ? "#00c2ff" : "#00ef6b";
        return {
          index: index + 1,
          agent_name: row.agent_name,
          factionLogo,
          factionColor,
          faction: row.faction,
          [stat1]: value1,
          [stat2]: value2,
          ratio,
          ratioPercent,
          difference,
        };
      })
      .filter((row) => row !== null);
    return tableData;
  }

  d3.csv("agent_statistics.csv")
    .then((data) => {
      const fields = Object.keys(data[0]).filter(
        (field) => !["Rank", "agent_name", "faction", "level"].includes(field)
      );
      fields.sort();
      populateSelect(fields);

      const { stat1, stat2, sort, order } = getQueryParams();
      stat1Select.value = stat1;
      stat2Select.value = stat2;

      const tableData = getTableData(data);
      stat1Select.addEventListener("change", updateURL);
      stat2Select.addEventListener("change", updateURL);
      dataTable = new DataTable("#statsTable", {
        data: tableData,
        layout: {
          topStart:{
            search: {
                text: '',
                placeholder: 'Search Agent'
            }
        },
          topEnd: null,
          bottomStart: 'pageLength',
          bottom2Start: 'info',
      },  
        columns: [
          { data: "index", title: "Rank", name: "index", sortable: false},
          {
            data: "agent_name",
            title: "Agent Name",
            render: function (data, type, row) {
              return `<img src="${row.factionLogo}" alt="${row.faction} logo" style="height: 20px; vertical-align: middle; margin-right: 5px;"><a href="https://link.ingress.com/?link=https://intel.ingress.com/agent/${data}" target="_blank" style="color: ${row.factionColor};">${data}</a>`;
            },
            name: "agent_name" , sortable: false,
          },
          {
            data: stat1,
            title: stat1,
            render: function (data) {
              return formatNumberWithCommas(data);
            },
            name: stat1,
          },
          {
            data: stat2,
            title: stat2,
            render: function (data) {
              return formatNumberWithCommas(data);
            },
            name: stat2,
          },
          {
            data: "ratio",
            title: "Ratio",
            render: function (data) {
              return data.toFixed(7);
            },
            name: "ratio",
          },
          {
            data: "ratioPercent",
            title: "Ratio %",
            render: function (data) {
              return data.toFixed(7);
            },
            name: "ratiopercent",
          },
          {
            data: "difference",
            title: "Difference",
            render: function (data) {
              return formatNumberWithCommas(data);
            },
            name: "difference",
          },
        ],
        autoWidth: false,
        responsive: false,
        fixedColumns: {
          leftColumns: 2,
        },
        scrollX: true,
        fixedHeader: true,
        ordering: true,
        order: { name: sort.toLowerCase(), dir: order.toLowerCase() },
      });
      dataTable
    .on('order.dt search.dt', function () {
        let i = 1;
 
        dataTable
            .cells(null, 0, { search: 'applied', order: 'applied' })
            .every(function (cell) {
                this.data(i++);
            });
    })
    .draw();
    })
    .catch((error) => {
      console.error("Error loading the CSV file:", error);
      statsTableRoot.innerHTML = "Error loading CSV file. Error: " + error;
    });
});

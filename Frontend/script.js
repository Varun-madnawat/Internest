const form = document.getElementById("form");

form.addEventListener("submit", async function(e){

    e.preventDefault();

    const skill =
    document.getElementById("skill").value;

    const sector =
    document.getElementById("sector").value;

    const location =
    document.getElementById("location").value;


    const output =
    document.getElementById(
    "output"
    );


    if(
        skill === "" ||
        sector === "" ||
        location === ""
    ){

        output.innerText =
        "Please fill all fields";

        return;
    }


    try{

        const response =
        await fetch(
        "http://127.0.0.1:8000/recommend",
        {
            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                skills:skill,
                sector:sector,
                location:location
            })

        });



        const data =
        await response.json();


        output.innerHTML = "";


        if(data.length===0){

            output.innerText =
            "No internships found";

            return;

        }


        console.log(data);

        data.forEach(intern=>{

                output.innerHTML +=

                `
                    <div class="card">

                        <h3>${intern.Company}</h3>

                        <p>
                        <b>Sector:</b>
                            ${intern.Sector}
                        </p>

                        <p>
                        <b>Location:</b>
                            ${intern.Location}
                        </p>

                        <p>
                        <b>Stipend:</b>
                            ₹${intern["Min Stipend"]} -
                            ₹${intern["Max Stipend"]}
                        </p>

                        <p>
                        <b>Duration:</b>
                            ${intern["Duration (months)"]}
                        Months
                        </p>

                </div>
                `;

});


    }

    catch(error){

        console.log(error);

        output.innerText =
        "Backend connection failed";

    }


    document.getElementById(
    "skill"
    ).value = "";

    document.getElementById(
    "sector"
    ).value = "";

    document.getElementById(
    "location"
    ).value = "";

});
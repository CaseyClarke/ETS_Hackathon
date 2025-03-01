document
    .getElementById("myForm")
    .addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent form submission
        document.getElementById("itemInfo").innerHTML = ""


        nums = []
        images = {
            "https://raw.githubusercontent.com/CaseyClarke/ETS_Hackathon/main/sampleLostItems/ashkan-forouzani-zAEZ2MOeJ9M-unsplash.jpg": [["Bag",0.98334306],["Fashion",0.95015776],["Luggage & bags",0.9311367],["Strap",0.9000806],["Pocket",0.8921436],["Shoulder Bag",0.8748099],["Messenger bag",0.8640523],["Buckle",0.84980947],["Backpack",0.8406813],["Leather",0.82804406]],
            "https://raw.githubusercontent.com/CaseyClarke/ETS_Hackathon/main/sampleLostItems/simon-daoudi-2wFoa040m8g-unsplash.jpg" : [["Watch",0.99483305],["Gadget",0.9615944],["Electronic device",0.9273924],["Strap",0.895607],["Technology",0.8581316],["Silver",0.8184489],["Clock",0.81681204],["Everyday carry",0.78958136],["Carbon fibers",0.75229704],["Analog watch",0.674671]],
            "https://raw.githubusercontent.com/CaseyClarke/ETS_Hackathon/main/sampleLostItems/quokkabottles-ader57qmvh0-unsplash.jpg" : [["Bottle",0.9521968],["Drinkware",0.8385227],["Plastic",0.7327497],["Water bottle",0.729174],["Plastic bottle",0.66509366],["Glass bottle",0.5000927]]
        }



        const formData = new FormData(event.target);
        const file = formData.get("Image"); // Get the File object
        console.log(formData)

        let reader = new FileReader();
        var f = new File([""], "filename");
        reader.readAsDataURL(file); // Convert file to base64
        

        reader.onloadend = async function () {

                const base64String = reader.result.split(",")[1]; // Extract base64 without prefix
                console.log("Base64 Encoded Image:", base64String); // Debugging
    
                const result = await analyzeImage(base64String);
                // console.log(result);
                array = result.labelAnnotations;
                out = [];
                for (i in array) {
                    out[i] = [array[i].description, array[i].score];
                }
        

            API_KEY = "AIzaSyDwwGTvWaX6KJ5ubxGFNWnEUHGcHmYVFpQ";
            const GEMINI_URL =
                "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=" +
                API_KEY;
            // Function to get text embedding
            async function getEmbedding(text) {
                try {
                    const response = await fetch(GEMINI_URL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ "content": {
                            "parts" : [{"text" : text}]
                        } }),
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const data = await response.json();
                    return data.embedding.values; // Extract embedding values
                } catch (error) {
                    console.error("Error:", error.message);
                    return null;
                }
            }



            // Function to calculate cosine similarity
            function cosineSimilarity(vec1, vec2) {
                const dotProduct = vec1.reduce(
                    (sum, val, i) => sum + val * vec2[i],
                    0
                );
                const norm1 = Math.sqrt(
                    vec1.reduce((sum, val) => sum + val * val, 0)
                );
                const norm2 = Math.sqrt(
                    vec2.reduce((sum, val) => sum + val * val, 0)
                );
                return dotProduct / (norm1 * norm2);
            }

            // Compare two text descriptions
            async function compareTexts(text1, text2) {
                const [embedding1, embedding2] = await Promise.all([
                    getEmbedding(text1),
                    getEmbedding(text2)
                ]);

                if (embedding1 && embedding2) {
                    const similarity = cosineSimilarity(embedding1, embedding2);
                    console.log(`Semantic Similarity: ${(similarity * 100).toFixed(2)}%`);
                    nums.push([(similarity * 100).toFixed(2), text2])
                } else {
                    console.log("Failed to get embeddings.");
                }
            }


            // console.log("asdasd")
            for (k in images) {
                // console.log(images[k])
                // console.log(JSON.stringify(out))
                await compareTexts(JSON.stringify(out), JSON.stringify(images[k]))
            }
            
            
            const maxIndex = nums.reduce((maxIdx, item, index, arr) => {
                return parseFloat(item[0]) > parseFloat(arr[maxIdx][0]) ? index : maxIdx;
            }, 0);
            console.log(nums[maxIndex])

            for (i in images) {
                console.log(nums[maxIndex][1])
                console.log(JSON.stringify(images[i]))
                console.log(JSON.stringify(images[i]) == nums[maxIndex][1])
                if (JSON.stringify(images[i]) == nums[maxIndex][1]) {
                    console.log(i)
                    document.getElementById("itemPicture").src = i;
                }
            }
            
            document.getElementById("hiddenItem").style.display = "block";
            

            function handleYes() {
                document.getElementById("itemInfo").innerHTML = document.getElementById("itemPicture").src;
            }

        };
    });

async function analyzeImage(imageBase64) {
    const apiKey = "AIzaSyABbAbFtRVi-oixIlRpUNIWOd_l83VKGEY";
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const requestBody = {
        requests: [
            {
                image: {
                    content: imageBase64,
                },
                features: [
                    {
                        type: "LABEL_DETECTION", // You can also use TEXT_DETECTION, FACE_DETECTION, etc.
                        maxResults: 10,
                    },
                ],
            },
        ],
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        return result.responses[0];
    } catch (error) {
        console.error("Error analyzing image:", error);
        return null;
    }
}
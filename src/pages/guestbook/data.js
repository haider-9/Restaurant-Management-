// Customer data structure:
// {
//   id: string,
//   name: string,
//   phone: string,
//   email: string,
//   lastVisited: string,
//   customerType: "Returning" | "New" | "VIP",
//   totalReservations: number,
//   totalNoShows: number,
//   totalCancellations: number,
//   notes: string,
//   allergies: string,
//   history: Array<{
//     date: string,
//     time: string,
//     partySize: number,
//     status: "Confirmed" | "No Show" | "Cancelled"
//   }>
// }

export function generateDummyCustomers(length = 25) {
    const firstNames = [
        "John",
        "Jane",
        "Michael",
        "Sarah",
        "David",
        "Emily",
        "Robert",
        "Lisa",
        "William",
        "Jennifer",
        "James",
        "Mary",
        "Christopher",
        "Patricia",
        "Daniel",
        "Linda",
        "Matthew",
        "Elizabeth",
        "Anthony",
        "Barbara",
        "Mark",
        "Susan",
        "Donald",
        "Jessica",
        "Steven",
        "Karen",
        "Thomas",
        "Nancy",
        "Charles",
        "Betty",
    ]

    const lastNames = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
        "Rodriguez",
        "Martinez",
        "Hernandez",
        "Lopez",
        "Gonzalez",
        "Wilson",
        "Anderson",
        "Thomas",
        "Taylor",
        "Moore",
        "Jackson",
        "Martin",
        "Lee",
        "Perez",
        "Thompson",
        "White",
        "Harris",
        "Sanchez",
        "Clark",
        "Ramirez",
        "Lewis",
        "Robinson",
    ]

    const customerTypes = ["Returning", "New", "VIP"]

    const allergies = [
        "Peanuts, Tree nuts",
        "Shellfish, Crustaceans",
        "Dairy products, Lactose",
        "Gluten, Wheat",
        "Eggs, Egg products",
        "Soy, Soybean oil",
        "Fish, Salmon",
        "Sesame seeds",
        "Strawberries",
        "Chocolate",
        "People",
        "",
        "",
    ]

    const notes = [
        "Prefers window seating with city view",
        "Vegetarian diet, no meat products",
        "Celebrates anniversary here annually",
        "Likes quiet atmosphere for business meetings",
        "Regular customer - knows staff by name",
        "Prefers early dining around 5:30 PM",
        "Business meetings frequent, needs WiFi",
        "Family with young children, needs high chairs",
        "Prefers corner booth for privacy",
        "Likes to try new menu items",
        "Always orders the same dish",
        "Prefers non-smoking section",
        "",
        "",
        "",
    ]

    return Array.from({ length }, (_, i) => {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
        const customerType = customerTypes[Math.floor(Math.random() * customerTypes.length)]

        // Generate random date within last 6 months
        const lastVisited = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

        const totalReservations = Math.floor(Math.random() * 50) + 1
        const totalNoShows = Math.floor(Math.random() * 5)
        const totalCancellations = Math.floor(Math.random() * 8)

        // Generate history
        const historyCount = Math.floor(Math.random() * 5) + 1
        const history = Array.from({ length: historyCount }, () => {
            const date = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
            const statuses = ["Confirmed", "Confirmed", "Confirmed", "No Show", "Cancelled"]

            return {
                date: date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
                time: `${Math.floor(Math.random() * 12) + 1}:${Math.random() > 0.5 ? "00" : "30"} ${Math.random() > 0.5 ? "PM" : "AM"}`,
                partySize: Math.floor(Math.random() * 8) + 1,
                status: statuses[Math.floor(Math.random() * statuses.length)],
            }
        })

        return {
            id: `customer-${i + 1}`,
            name: `${firstName} ${lastName}`,
            phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
            lastVisited,
            customerType,
            totalReservations,
            totalNoShows,
            totalCancellations,
            notes: notes[Math.floor(Math.random() * notes.length)],
            allergies: allergies[Math.floor(Math.random() * allergies.length)],
            history,
        }
    })
}

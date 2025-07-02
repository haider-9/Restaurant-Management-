export const mockContacts = [
    {
        id: 1,
        name: "John Doe",
        avatar: "/avatars/john.jpg",
        lastMessage: "Hey, how are you?",
        time: "2m ago",
        unread: 2,
        online: true,
        role: "admin",
    },
    {
        id: 2,
        name: "Jane Smith",
        avatar: "/avatars/jane.jpg",
        lastMessage: "Thanks for the help!",
        time: "1h ago",
        unread: 0,
        online: false,
        role: "tenant",
    },
    {
        id: 3,
        name: "Mike Johnson",
        avatar: "/avatars/mike.jpg",
        lastMessage: "Can we meet tomorrow?",
        time: "3h ago",
        unread: 1,
        online: true,
        role: "tenant",
    },
];

export const mockMessages = {
    1: [
        {
            id: 1,
            sender: "other",
            text: "Hey, how are you?",
            time: "2:30 PM",
            seen: true,
        },
        {
            id: 2,
            sender: "self",
            text: "I'm good, thanks! How about you?",
            time: "2:32 PM",
            seen: false,
        },
        {
            id: 6,
            sender: "self",
            text: "Doing well, thanks!",
            time: "2:33 PM",
            seen: false,
        },
    ],
    2: [
        {
            id: 3,
            sender: "other",
            text: "Thanks for the help!",
            time: "1:15 PM",
            seen: true,
        },
        {
            id: 4,
            sender: "self",
            text: "You're welcome!",
            time: "1:16 PM",
            seen: true,
        },
    ],
    3: [
        {
            id: 5,
            sender: "other",
            text: "Can we meet tomorrow?",
            time: "11:30 AM",
            seen: false,
        },
    ],
};

export const emojis = ["😀", "😂", "😍", "🤔", "👍", "👎", "❤️", "🔥", "💯", "🎉"];
"use client"
import Header from "@/src/components/Header"

const SendSms = ( )=> {
    return(
        <div>
            <Header appName="Send Sms"
                username="John Doe"
                profileImageUrl="/profile.jpg" // Use a default or actual profile image
                onLogout={() => console.log()} />
                <div className="min-h-screen p-8 bg-gray-50"></div>
            coming soon
        </div>
    )
}

export default SendSms
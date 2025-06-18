const Config = {
    github: "ash27z",
    discord: "670904205988462600",
    updateInterval: 15000
};

const Elements = {
    Projects: document.getElementById("projectsContainer"),
    DiscordProfile: document.getElementById("discordProfile"),
    Avatar: document.querySelector(".profile-image"),
    Username: document.getElementById("profileName"),
    StatusIndicator: document.getElementById("statusIndicator"),
    StatusDisplay: document.getElementById("statusDisplay"),
    ActivityDisplay: document.getElementById("activityDisplay"),
    MobileToggle: document.querySelector(".mobile-menu-toggle"),
    NavMenu: document.querySelector(".nav-menu"),
    NavigationBar: document.querySelector(".navigation-bar")
};

Elements.MobileToggle?.addEventListener("click", function() {
    Elements.NavMenu?.classList.toggle("active");
});

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        Elements.NavMenu?.classList.remove("active");
    });
});

async function LoadProjects() {
    try {
        const response = await fetch(`https://api.github.com/users/${Config.github}/repos`);
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const repositories = await response.json();
        
        Elements.Projects.innerHTML = '';
        
        const filteredRepos = repositories
            .filter(repo => !repo.fork)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 6);
        
        if (filteredRepos.length === 0) {
            Elements.Projects.innerHTML = '<div class="loading-projects">No public repositories found.</div>';
            return;
        }
        
        filteredRepos.forEach(repository => {
            const projectElement = document.createElement("div");
            projectElement.className = "project-item";
            
            const lastUpdated = new Date(repository.updated_at).toLocaleDateString();
            const language = repository.language ? `<span style="color: var(--electric-teal);">${repository.language}</span>` : '';
            
            projectElement.innerHTML = `
                <h3 class="project-title">${repository.name}</h3>
                <p class="project-description">${repository.description || "No description available"}</p>
                <div style="margin-bottom: 1rem; font-size: 0.8rem; color: rgba(255,255,255,0.6);">
                    ${language}
                    ${language ? ' • ' : ''}Updated: ${lastUpdated}
                </div>
                <a href="${repository.html_url}" target="_blank" class="project-link">
                    View Repository
                </a>
            `;
            
            Elements.Projects.appendChild(projectElement);
        });
        
    } catch (error) {
        console.error("Failed to load projects:", error);
        Elements.Projects.innerHTML = '<div class="loading-projects">Failed to load projects. Please try again later.</div>';
    }
}

async function FetchDiscordStatus() {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${Config.discord}`);
        
        if (!response.ok) {
            throw new Error(`Lanyard API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error("Lanyard API returned unsuccessful response");
        }
        
        UpdateDiscordProfile(data.data);
        
    } catch (error) {
        console.error("Discord status fetch failed:", error);
        HandleDiscordError();
    }
}


function UpdateDiscordProfile(data) {
    const userInfo = data.discord_user;
    const currentStatus = data.discord_status;
    const activities = data.activities || [];
    
    const defaultAvatarUrl = userInfo.avatar 
        ? `https://cdn.discordapp.com/avatars/${Config.discord}/${userInfo.avatar}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${userInfo.discriminator % 5}.png`;
    
    Elements.Avatar.src = defaultAvatarUrl;
    Elements.Avatar.alt = `${userInfo.username}'s Avatar`;
    
    const displayName = userInfo.global_name || userInfo.username;
    Elements.Username.textContent = displayName;
    
    Elements.StatusIndicator.className = `status-indicator ${currentStatus}`;
    
    const statusMessages = {
        online: "Online",
        idle: "Idle",
        dnd: "Do Not Disturb",
        offline: "Offline"
    };
    
    Elements.StatusDisplay.textContent = statusMessages[currentStatus] || "Unknown Status";
    
    UpdateActivityDisplay(activities, data.listening_to_spotify);
    
    Elements.DiscordProfile.style.display = "flex";
}

function UpdateActivityDisplay(activities, spotify) {
    let activityText = "";
    
    if (spotify && spotify.song && spotify.artist) {
        const albumArt = spotify.album_art_url;
        
        const spotifySection = `
            <div class="spotify-section">
                <img src="${albumArt}" alt="${spotify.song} Album Art" class="spotify-album-art">
                <div class="spotify-info">
                    <div class="spotify-song">${spotify.song}</div>
                    <div class="spotify-artist">${spotify.artist}</div>
                </div>
            </div>
        `;
        
        Elements.ActivityDisplay.innerHTML = spotifySection;
        Elements.ActivityDisplay.style.display = "block";
        return;
    }
    
    if (activities && activities.length > 0) {
        const activity = activities[0];
        
        if (!activity.name) {
            Elements.ActivityDisplay.style.display = "none";
            return;
        }
        
        switch (activity.type) {
            case 0:
                activityText = `Playing ${activity.name}`;
                break;
            case 1:
                activityText = `Streaming ${activity.name}`;
                break;
            case 2:
                activityText = `Listening to ${activity.name}`;
                break;
            case 3:
                activityText = `Watching ${activity.name}`;
                break;
            case 5:
                activityText = `Competing in ${activity.name}`;
                break;
            default:
                activityText = activity.name;
        }
        
        if (activity.details) {
            activityText += ` - ${activity.details}`;
        }
        
        Elements.ActivityDisplay.innerHTML = activityText;
        Elements.ActivityDisplay.style.display = "block";
    } else {
        Elements.ActivityDisplay.style.display = "none";
    }
}

function HandleDiscordError() {
    Elements.Username.textContent = "Discord Status Unavailable";
    Elements.StatusDisplay.textContent = "Unable to fetch status";
    Elements.StatusIndicator.className = "status-indicator offline";
    Elements.ActivityDisplay.style.display = "none";
    
    console.warn(`Retrying to get discord config in ${Config.updateInterval / 1000} seconds`);
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", function(event) {
        event.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: "smooth"
            });
        }
    });
});

window.addEventListener("scroll", () => {
    const scrolled = window.scrollY > 50;
    Elements.NavigationBar.style.backgroundColor = scrolled 
        ? "rgba(26, 26, 46, 0.98)"
        : "rgba(26, 26, 46, 0.95)";
});

const ObserverOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const FadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
        }
    });
}, ObserverOptions);

document.querySelectorAll(".content-section").forEach(section => {
    FadeInObserver.observe(section);
});

document.addEventListener("DOMContentLoaded", function() {
    LoadProjects();
    FetchDiscordStatus();
    setInterval(FetchDiscordStatus, Config.updateInterval);
    
    console.log("Successfully Initialized..");
});

document.addEventListener("visibilitychange", function() {
    if (!document.hidden) {
        FetchDiscordStatus();
    }
});

window.addEventListener("error", function(event) {
    console.error("Uncaught error:", event.error);
});

window.addEventListener("online", function() {
    console.log("🌐 Connection restored");
    FetchDiscordStatus();
    LoadProjects();
});

window.addEventListener("offline", function() {
    console.warn("📡 Connection lost");
});
function chd
    switch $argv[1]
        case 1
            cd "/run/media/thorfinn/Additional"
        case 2
            cd "/run/media/thorfinn/games"
        case 3
            cd "/run/media/thorfinn/Glorious Purposes"
        case 4
            cd "/run/media/thorfinn/Software Development"
        case 5
            cd "/run/media/thorfinn/Softwares"
        case 6
            cd "/run/media/thorfinn/Treasure"
        case '*'
            echo "❌ Please give a valid disk index (1 to 6)"
    end
end

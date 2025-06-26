function chd
    if test (count $argv) -eq 0
        echo "Usage: chd <disk_index>"
        return 1
    end

    set disk_index $argv[1]

    switch $disk_index
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
            echo "❌ Invalid disk index. Usage: chd <1-6>"
            return 1
    end
end

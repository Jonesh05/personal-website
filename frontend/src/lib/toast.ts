export const customToast = {
    success: (message: string) => {
        if (typeof window !== 'undefined') {
            // Simple alert for admin notifications instead of react-hot-toast
            alert(`✅ ${message}`)
        } else {
            console.log(`Success: ${message}`)
        }
    },

    error: (message: string) => {
        if (typeof window !== 'undefined') {
            alert(`❌ Error: ${message}`)
        } else {
            console.error(`Error: ${message}`)
        }
    },

    info: (message: string) => {
        if (typeof window !== 'undefined') {
            alert(`ℹ️ ${message}`)
        } else {
            console.info(`Info: ${message}`)
        }
    },

    loading: (message: string) => {
        console.log(`Loading: ${message}`)
        return "loading-toast-id"
    },

    promise: async <T>(
        promise: Promise<T>,
        msgs: {
            loading: string
            success: string
            error: string
        }
    ) => {
        console.log(`Loading: ${msgs.loading}`)
        try {
            const result = await promise
            if (typeof window !== 'undefined') {
                alert(`✅ ${msgs.success}`)
            }
            return result
        } catch (error) {
            if (typeof window !== 'undefined') {
                alert(`❌ Error: ${msgs.error}`)
            }
            throw error
        }
    }
}

// Export as default for backward compatibility
export { customToast as toast }
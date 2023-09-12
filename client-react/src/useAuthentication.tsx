import React, {useState, useContext} from "react";


const AuthenticationContext = React.createContext({
	username: "",
	password: "",
	isLoggedIn: false,
	login: (u: string, p: string) => {},
	logout: () => {}
});

export function useAuthentication()
{
	return useContext(AuthenticationContext);
}

export function AuthenticationProvider({children}: React.PropsWithChildren<{}>) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	function login(u: string, p: string) {
		setUsername(u);
		setPassword(p);
		setIsLoggedIn(true); // after setting username and password, because it activates the queries
	}

	function logout() {
		setIsLoggedIn(false);
		setUsername("");
		setPassword("");
	}

	return (
		<AuthenticationContext.Provider value={{username, password, isLoggedIn, login, logout}}>
			{children}
		</AuthenticationContext.Provider>
	);
}


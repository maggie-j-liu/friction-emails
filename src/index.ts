interface Env {
	AUTH_TOKEN: string;
	DKIM_PRIVATE_KEY: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (!request.headers.has('Authorization')) {
			return new Response('Unauthorized', {
				status: 401,
			});
		}
		const authorization = request.headers.get('Authorization') as string;
		const [scheme, token] = authorization.split(' ');
		if (!token || scheme !== 'Bearer' || token !== env.AUTH_TOKEN) {
			return new Response('Unauthorized', {
				status: 401,
			});
		}

		if (!request.headers.get('Content-Type')?.includes('application/json')) {
			return new Response('Invalid Content-Type', {
				status: 415,
			});
		}

		const body: {
			to: string | string[];
			htmlMessage: string;
			textMessage: string;
			subject: string;
			from: string;
		} = await request.json();

		if (!body.to || !body.htmlMessage || !body.textMessage || !body.subject || !body.from) {
			return new Response("Doesn't include all required arguments", {
				status: 400,
			});
		}

		let { to, subject, htmlMessage, textMessage, from } = body;

		const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				personalizations: [
					{
						to: [
							{
								email: to,
							},
						],
						dkim_domain: 'maggieliu.dev',
						dkim_selector: 'mailchannels',
						dkim_private_key: env.DKIM_PRIVATE_KEY,
					},
				],
				from: {
					email: from,
				},
				subject,
				content: [
					{
						type: 'text/plain',
						value: textMessage,
					},
					{
						type: 'text/html',
						value: htmlMessage,
					},
				],
			}),
		});
		console.log(res);

		const message = await res.text();
		console.log(res.status);
		console.log(message);
		return new Response('Hello, world!');
	},
};

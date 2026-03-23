export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    if (!privateKey) {
      return Response.json(
        {
          error: 'Sunucu yukleme ayarlari eksik. IMAGEKIT_PRIVATE_KEY tanimlayin.',
        },
        { status: 500 }
      );
    }

    const data = await request.formData();
    const file = data.get('file');

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'Yuklenecek dosya bulunamadi.' }, { status: 400 });
    }

    const folder = (data.get('folder') || 'birbucukadana').toString();
    const fileName = file.name || `upload-${Date.now()}`;
    const bytes = await file.arrayBuffer();
    const base64File = Buffer.from(bytes).toString('base64');
    const basicAuth = Buffer.from(`${privateKey}:`).toString('base64');

    const body = new FormData();
    body.append('file', base64File);
    body.append('fileName', fileName);
    body.append('folder', folder);
    body.append('useUniqueFileName', 'true');

    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
      body,
    });

    const result = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: result?.message || 'Yukleme sirasinda bir hata olustu.',
        },
        { status: 400 }
      );
    }

    return Response.json({
      secureUrl: result.url,
      publicId: result.fileId,
      format: result.format,
    });
  } catch {
    return Response.json({ error: 'Beklenmeyen bir hata olustu.' }, { status: 500 });
  }
}
